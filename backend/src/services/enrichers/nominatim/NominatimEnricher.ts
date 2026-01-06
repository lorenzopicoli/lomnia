import axios, { type AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { asc, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import config from "../../../config";
import { type DBTransaction, type Point, toPostgisGeoPoint } from "../../../db/types";
import { delay } from "../../../helpers/delay";
import { locationDetailsTable, locationsTable, type NewLocationDetails } from "../../../models";
import { NominatimCache } from "../../cache/NominatimCache";
import { Logger } from "../../Logger";
import {
  mapNominatimApiResponseToPlace,
  type NominatimReverseResponse,
  NominatimReverseResponseSchema,
} from "../../reverseGeocode/nominatimSchema";
import { BaseEnricher } from "../BaseEnricher";

export class NominatimEnricher extends BaseEnricher {
  private apiVersion = "https://nominatim.openstreetmap.org/";
  private importBatchSize = 1;
  private maxImportSession = config.importers.locationDetails.nominatim.maxImportSession;

  private precisionRadiusInMeters = 20;

  private apiCallsDelay = config.importers.locationDetails.nominatim.apiCallsDelay;
  private apiUrl = this.apiVersion;
  private cache = NominatimCache.init();
  private http: AxiosInstance;
  protected logger = new Logger("NominatimEnricher");

  public isEnabled(): boolean {
    return config.importers.locationDetails.nominatim.enabled;
  }

  constructor() {
    super();
    const http = axios.create({
      baseURL: this.apiUrl,
      headers: { "User-Agent": config.importers.locationDetails.nominatim.userAgent },
    });

    axiosRetry(http, { retries: 3, retryDelay: axiosRetry.linearDelay(1000) });
    this.http = http;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    let importedCount = 0;

    let nextLocation = await this.getNextPage(tx);
    let previousTimer = new Date();
    while (nextLocation[0]) {
      const currentTimer = new Date();
      const location = nextLocation[0];
      const timeEllapsed = currentTimer.getTime() - previousTimer.getTime();
      let wasLastResultCached = false;

      if (timeEllapsed < this.apiCallsDelay && !wasLastResultCached) {
        const remainingTime = this.apiCallsDelay - timeEllapsed;
        this.logger.debug("Waiting before calling Nominatim again", {
          delay: remainingTime,
        });
        await delay(remainingTime);
      }

      this.logger.debug("Checking cache for location", {
        locationId: location.id,
        locationPos: location.location,
        recordedAt: location.recordedAt,
      });

      const apiCallParams = {
        format: "json",
        zoom: 18,
        namedetails: 1,
        extratags: 1,
        lat: location.location.lat,
        lon: location.location.lng,
      };
      const { isCached, response } = await this.getApiResponse(apiCallParams, location.recordedAt).catch((e) => {
        this.logger.debug("Got Nominatim error", {
          locationId: location.id,
          locationPos: location.location,
          recordedAt: location.recordedAt,
          e,
        });
        throw e;
      });
      wasLastResultCached = isCached;
      if (wasLastResultCached) {
        previousTimer = currentTimer;
      }
      this.logger.debug("Got Nominatim response", {
        locationId: location.id,
        locationPos: location.location,
        recordedAt: location.recordedAt,
      });

      const parsedResponse = NominatimReverseResponseSchema.parse(response);
      const mappedResponse = this.mapApiResponseToDbSchema(location.location, parsedResponse);

      if (mappedResponse) {
        const existingDetails = mappedResponse.osmId
          ? await tx.query.locationDetailsTable.findFirst({
              where: sql`
            ${locationDetailsTable.osmId} = ${mappedResponse.osmId}
            ${
              mappedResponse.displayName
                ? sql`AND ${locationDetailsTable.displayName} = ${mappedResponse.displayName}`
                : sql``
            }
          `,
            })
          : null;

        const savedLocationDetails = existingDetails
          ? { id: existingDetails.id }
          : await tx
              .insert(locationDetailsTable)
              .values(mappedResponse)
              .returning({ id: locationDetailsTable.id })
              .then((r) => r[0]);

        await tx
          .update(locationsTable)
          .set({ locationDetailsId: savedLocationDetails.id })
          .where(
            sql`
          ${locationsTable.locationDetailsId} IS NULL AND
          ST_DWithin(
            ${locationsTable.location},
            ${toPostgisGeoPoint(location.location)},
            ${this.precisionRadiusInMeters}
          )`,
          );
        importedCount++;
        if (importedCount >= this.maxImportSession) {
          break;
        }
      } else {
        await tx
          .update(locationsTable)
          .set({ failedToReverseGeocode: true })
          .where(sql`${locationsTable.id} = ${location.id}`);
      }
      nextLocation = await this.getNextPage(tx);
    }
  }

  private async getApiResponse(
    apiCallParams: {
      format: string;
      zoom: number;
      namedetails: number;
      extratags: number;
      lat: number;
      lon: number;
    },
    locationRecordedAt: Date | null,
  ) {
    if (!locationRecordedAt) {
      throw new Error("Missing location recorded at");
    }
    const dateTimeRecordedAt = DateTime.fromJSDate(locationRecordedAt, { zone: "UTC" });
    const cached = locationRecordedAt ? await this.cache.get(apiCallParams, dateTimeRecordedAt) : null;

    if (cached) {
      this.logger.info("Cache hit for location", { apiCallParams, locationRecordedAt });
      return { isCached: true, response: cached.response };
    }
    this.logger.debug("Cache miss, calling Nominatim API for params", { apiCallParams, locationRecordedAt });
    const response = await this.http
      .get("/reverse", {
        params: apiCallParams,
      })
      .then((r) => r.data);

    await this.cache.set({ response, eventAt: dateTimeRecordedAt, fetchedAt: DateTime.utc(), request: apiCallParams });
    return { isCached: false, response };
  }

  private mapApiResponseToDbSchema(location: Point, apiResponse: NominatimReverseResponse): NewLocationDetails | null {
    if (!apiResponse.display_name) {
      this.logger.warn("No name found for location", { location, apiResponse });
      return null;
    }
    return {
      ...mapNominatimApiResponseToPlace(apiResponse),
      source: "external",
      location,
      createdAt: new Date(),
    };
  }
  private async getNextPage(tx: DBTransaction) {
    const next = await tx
      .select()
      .from(locationsTable)
      .where(
        sql`
        ${locationsTable.locationDetailsId} IS NULL
        AND NOT ${locationsTable.failedToReverseGeocode}
    `,
      )
      .orderBy(asc(locationsTable.recordedAt))
      .limit(this.importBatchSize);

    return next;
  }
}

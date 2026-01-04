import axios from "axios";
import axiosRetry from "axios-retry";
import { asc, sql } from "drizzle-orm";
import config from "../../../config";
import { type DBTransaction, type Point, toPostgisGeoPoint } from "../../../db/types";
import { delay } from "../../../helpers/delay";
import { locationDetailsTable, locationsTable, type NewLocationDetails } from "../../../models";
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

  protected logger = new Logger("NominatimEnricher");

  public isEnabled(): boolean {
    return config.importers.locationDetails.nominatim.enabled;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    let importedCount = 0;

    const http = axios.create({
      baseURL: this.apiUrl,
      headers: { "User-Agent": config.importers.locationDetails.nominatim.userAgent },
    });

    axiosRetry(http, { retries: 3, retryDelay: axiosRetry.linearDelay(1000) });

    let nextLocation = await this.getNextPage(tx);
    let previousTimer = new Date();
    while (nextLocation[0]) {
      const currentTimer = new Date();
      const location = nextLocation[0];
      const timeEllapsed = currentTimer.getTime() - previousTimer.getTime();
      if (timeEllapsed < this.apiCallsDelay) {
        const remainingTime = this.apiCallsDelay - timeEllapsed;
        this.logger.debug("Waiting before calling Nominatim again", {
          delay: remainingTime,
        });
        await delay(remainingTime);
      } else {
        this.logger.debug("Skipping wait time since ellapsed time is longer than delay", {
          delay: this.apiCallsDelay,
          timeEllapsed,
        });
      }
      this.logger.debug("Calling Nominatim API for location", {
        locationId: location.id,
        locationPos: location.location,
        recordedAt: location.recordedAt,
      });
      const response = await http
        .get("/reverse", {
          params: {
            format: "json",
            zoom: 18,
            namedetails: 1,
            extratags: 1,
            lat: location.location.lat,
            lon: location.location.lng,
          },
        })
        .catch((e) => {
          this.logger.debug("Got Nominatim error", {
            locationId: location.id,
            locationPos: location.location,
            recordedAt: location.recordedAt,
            e,
          });
          throw e;
        });
      previousTimer = currentTimer;
      this.logger.debug("Got Nominatim response", {
        locationId: location.id,
        locationPos: location.location,
        recordedAt: location.recordedAt,
      });

      const parsedResponse = NominatimReverseResponseSchema.parse(response.data);
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

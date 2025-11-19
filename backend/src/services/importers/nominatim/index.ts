import axios from "axios";
import axiosRetry from "axios-retry";
import { asc, sql } from "drizzle-orm";
import type { DateTime } from "luxon";
import config from "../../../config";
import { db } from "../../../db/connection";
import { type DBTransaction, type Point, toPostgisGeoPoint } from "../../../db/types";
import { delay } from "../../../helpers/delay";
import { locationsTable } from "../../../models";
import { locationDetailsTable, type NewLocationDetails } from "../../../models/LocationDetails";
import { BaseImporter } from "../BaseImporter";
import { type NominatimReverseResponse, NominatimReverseResponseSchema } from "./schema";

export class NominatimImport extends BaseImporter {
  override sourceId = "nomatim-v1";
  override apiVersion = "https://nominatim.openstreetmap.org/";
  override destinationTable = "location_details";
  override entryDateKey = "date";
  private importBatchSize = 1;
  private maxImportSession = config.importers.locationDetails.nominatim.maxImportSession;
  private logs: string[] = [];

  private precisionRadiusInMeters = 20;

  private apiCallsDelay = config.importers.locationDetails.nominatim.apiCallsDelay;
  private apiUrl = this.apiVersion;

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    return await db.transaction(async (tx) => {
      const value = await this.getNextPage({ tx });

      return { result: value.length > 0, totalEstimate: value.length };
    });
  }

  private mapApiResponseToDbSchema(
    location: Point,
    placeholderJobId: number,
    apiResponse: NominatimReverseResponse,
  ): NewLocationDetails | null {
    if (!apiResponse.display_name) {
      this.logger.warn("No name found for location", { location, apiResponse });
      this.logs.push(`No name for location ${location}, api response: ${JSON.stringify(apiResponse)}`);
      return null;
    }
    return {
      source: "external",
      location,
      importJobId: placeholderJobId,

      placeId: apiResponse.place_id?.toString(),
      licence: apiResponse.licence,
      osmType: apiResponse.osm_type,
      osmId: apiResponse.osm_id?.toString(),
      placeRank: apiResponse.place_rank,
      category: apiResponse.class,
      type: apiResponse.type,
      importance: String(apiResponse.importance),
      addressType: apiResponse.addresstype,
      displayName: apiResponse.display_name,
      extraTags: apiResponse.extratags,
      nameDetails: apiResponse.namedetails,
      name: apiResponse.name ?? "",
      houseNumber: apiResponse.address?.house_number,
      road: apiResponse.address?.road,
      suburb: apiResponse.address?.suburb,
      city: apiResponse.address?.city,
      county: apiResponse.address?.county,
      region: apiResponse.address?.region,
      state: apiResponse.address?.state,
      iso3166_2_lvl4: apiResponse.address?.["ISO3166-2-lvl4"],
      postcode: apiResponse.address?.postcode,
      country: apiResponse.address?.country,
      countryCode: apiResponse.address?.country_code,
    };
  }

  public async getNextPage(params: { tx: DBTransaction }) {
    const next = await params.tx
      .select()
      .from(locationsTable)
      .where(
        sql`
        ${locationsTable.locationDetailsId} IS NULL
        AND NOT ${locationsTable.failedToReverseGeocode}
    `,
      )
      .orderBy(asc(locationsTable.locationFix))
      .limit(this.importBatchSize);

    return next;
  }

  override async import(params: { tx: DBTransaction; placeholderJobId: number }): Promise<{
    importedCount: number;
    firstEntryDate?: Date;
    lastEntryDate?: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    let importedCount = 0;
    let apiCalls = 0;

    const http = axios.create({
      baseURL: this.apiUrl,
      headers: { "User-Agent": config.importers.locationDetails.nominatim.userAgent },
    });

    axiosRetry(http, { retries: 3, retryDelay: axiosRetry.linearDelay(1000) });

    let nextLocation = await this.getNextPage({ tx: params.tx });
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
        locationFix: location.locationFix,
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
            locationFix: location.locationFix,
            e,
          });
          throw e;
        });
      previousTimer = currentTimer;
      this.logger.debug("Got Nominatim response", {
        locationId: location.id,
        locationPos: location.location,
        locationFix: location.locationFix,
      });

      const parsedResponse = NominatimReverseResponseSchema.parse(response.data);
      const mappedResponse = this.mapApiResponseToDbSchema(location.location, params.placeholderJobId, parsedResponse);

      if (mappedResponse) {
        const existingDetails = mappedResponse.osmId
          ? await params.tx.query.locationDetailsTable.findFirst({
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
          : await params.tx
              .insert(locationDetailsTable)
              .values(mappedResponse)
              .returning({ id: locationDetailsTable.id })
              .then((r) => r[0]);

        await params.tx
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
        await params.tx
          .update(locationsTable)
          .set({ failedToReverseGeocode: true })
          .where(sql`${locationsTable.id} = ${location.id}`);
      }
      this.updateFirstAndLastEntry(location.locationFix);
      apiCalls++;
      nextLocation = await this.getNextPage({ tx: params.tx });
    }
    return {
      importedCount,
      apiCallsCount: apiCalls,
      logs: this.logs,
    };
  }
}

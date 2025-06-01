import { asc, sql } from "drizzle-orm";
import { db } from "../../../db/connection";
import { BaseImporter } from "../BaseImporter";
import { locationsTable } from "../../../models";
import { toPostgisGeoPoint, type DBTransaction, type Point } from "../../../db/types";
import axios from "axios";
import { locationDetailsTable, type NewLocationDetails } from "../../../models/LocationDetails";
import { delay } from "../../../helpers/delay";

export class NominatimImport extends BaseImporter {
  override sourceId = "nomatim-v1";
  override apiVersion = "https://nominatim.openstreetmap.org/";
  override destinationTable = "location_details";
  override entryDateKey = "date";
  private importBatchSize = 1;
  private maxImportSession = 1000;
  private logs: string[] = [];

  private precisionRadiusInMeters = 20;

  // In ms
  private apiCallsDelay = 1500;
  private apiUrl = this.apiVersion;

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: Date;
    totalEstimate?: number;
  }> {
    const count = await db
      .select({
        count: sql`COUNT(id)`.mapWith(Number),
      })
      .from(locationsTable)
      .where(sql`
        (
        ${locationsTable.locationDetailsId} IS NULL
        )
    `);

    const value = count[0].count ?? 0;
    return { result: value > 0, totalEstimate: value };
  }

  private mapApiResponseToDbSchema(
    location: Point,
    placeholderJobId: number,
    apiResponse: any,
  ): NewLocationDetails | null {
    if (!apiResponse.display_name) {
      console.log(`No name for location ${location}, api response: ${JSON.stringify(apiResponse)}`);
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
      importance: apiResponse.importance,
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

  private prevNext: Awaited<ReturnType<NominatimImport["getNextPage"]>>[number] | undefined;

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

    if (next.length === 0) {
      return next;
    }

    this.prevNext = next[0];

    return next;
  }

  override async import(params: {
    tx: DBTransaction;
    placeholderJobId: number;
  }): Promise<{
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
      // TODO: this needs to be specific to each user
      headers: { "User-Agent": "lomnia" },
    });

    let nextLocation = await this.getNextPage({ tx: params.tx });

    while (nextLocation[0]) {
      const location = nextLocation[0];
      await delay(this.apiCallsDelay);
      const response = await http.get("/reverse", {
        params: {
          format: "json",
          zoom: 18,
          namedetails: 1,
          extratags: 1,
          lat: location.location.lat,
          lon: location.location.lng,
        },
      });
      const mappedResponse = this.mapApiResponseToDbSchema(location.location, params.placeholderJobId, response.data);

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

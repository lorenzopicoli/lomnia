import { asc, sql } from "drizzle-orm";
import { DateTime } from "luxon";
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
import { Nominatim } from "../../nominatim/Nominatim";

export class NominatimEnricher extends BaseEnricher {
  private importBatchSize = 1;
  private maxImportSession = config.importers.locationDetails.nominatim.maxImportSession;

  private precisionRadiusInMeters = 20;

  private apiCallsDelay = config.importers.locationDetails.nominatim.apiCallsDelay;
  protected logger = new Logger("NominatimEnricher");
  private nominatimApi = new Nominatim(this.logger);

  public isEnabled(): boolean {
    return config.importers.locationDetails.nominatim.enabled;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    let importedCount = 0;

    let nextLocation = await this.getNextPage(tx);
    let previousTimer = new Date();
    let wasLastResultCached = false;
    while (nextLocation[0]) {
      const currentTimer = new Date();
      const location = nextLocation[0];
      const timeEllapsed = currentTimer.getTime() - previousTimer.getTime();

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

      if (!location.recordedAt) {
        throw new Error("Found location without a recordedAt field");
      }
      const dateTimeRecordedAt = DateTime.fromJSDate(location.recordedAt, { zone: "UTC" });
      const { isCached, response } = await this.nominatimApi.reverseGeocode({
        location: location.location,
        when: dateTimeRecordedAt,
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
            ${mappedResponse.displayName
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

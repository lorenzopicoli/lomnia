import { asc, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import config from "../../../config";
import { type DBTransaction, type Point, toPostgisGeoPoint } from "../../../db/types";
import { delay } from "../../../helpers/delay";
import { locationDetailsTable, locationsTable, type NewLocationDetails } from "../../../models";
import { Logger } from "../../Logger";
import { Nominatim } from "../../nominatim/Nominatim";
import {
  mapNominatimApiResponseToPlace,
  type NominatimReverseResponse,
  NominatimReverseResponseSchema,
} from "../../reverseGeocode/nominatimSchema";
import { BaseEnricher } from "../BaseEnricher";

export class NominatimEnricher extends BaseEnricher {
  private importBatchSize = 1;
  private maxImportSessionDuration = config.enrichers.locationDetails.nominatim.maxImportSessionDuration;

  private precisionRadiusInMeters = 50;

  private apiCallsDelay = config.enrichers.locationDetails.nominatim.apiCallsDelay;
  protected logger = new Logger("NominatimEnricher");
  private nominatimApi = new Nominatim(this.logger);

  public isEnabled(): boolean {
    return config.enrichers.locationDetails.nominatim.enabled;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    const startTime = DateTime.now();
    let apiCallsCount = 0;
    let cacheHits = 0;
    let lastLogAt = DateTime.now();
    const LOG_EVERY_MS = 5_000;

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
      const { isCached, response, validFrom, validTo } = await this.nominatimApi.reverseGeocode({
        location: location.location,
        when: dateTimeRecordedAt,
      });

      if (isCached) {
        cacheHits++;
      } else {
        apiCallsCount++;
      }
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
      if (parsedResponse.error) {
        this.logger.error("Error in nominatim response", { location, error: parsedResponse.error });
        await tx
          .update(locationsTable)
          .set({ failedToReverseGeocode: true })
          .where(sql`${locationsTable.id} = ${location.id}`);
        nextLocation = await this.getNextPage(tx);
        // TODO: Delete failed from cache?
        continue;
      }
      const mappedResponse = this.mapApiResponseToDbSchema(location.location, parsedResponse);

      if (!mappedResponse) {
        await tx
          .update(locationsTable)
          .set({ failedToReverseGeocode: true })
          .where(sql`${locationsTable.id} = ${location.id}`);
        // TODO: Delete failed from cache?

        nextLocation = await this.getNextPage(tx);
        continue;
      }

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
          )
          AND ${locationsTable.recordedAt} >= ${validFrom.toISO()}
          AND ${locationsTable.recordedAt} <= ${validTo.toISO()}
          `,
        );

      const now = DateTime.now();
      if (Math.abs(now.diff(lastLogAt, "milliseconds").milliseconds) >= LOG_EVERY_MS) {
        const elapsedSec = Math.abs(now.diff(startTime, "seconds").seconds);
        const rate = Math.round((apiCallsCount + cacheHits) / elapsedSec);

        this.logger.info("Progress", {
          cacheHits,
          apiCallsCount,
          elapsedSec: elapsedSec.toFixed(1),
          linesPerSec: rate,
          lastDate: dateTimeRecordedAt.toISO(),
        });

        lastLogAt = now;
      }

      // If it has been running for longer than allowed, break out of the loop
      if (Math.abs(startTime.diffNow("seconds").seconds) >= this.maxImportSessionDuration) {
        this.logger.debug("Enricher is running for too long, breaking...");
        break;
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

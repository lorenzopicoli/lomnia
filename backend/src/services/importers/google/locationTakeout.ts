import { BaseImporter } from "../BaseImporter";
import type { DBTransaction } from "../../../db/types";
import { z } from "zod";
import { locationsTable } from "../../../models";
import { DateTime } from "luxon";
import { sql } from "drizzle-orm";
import { find } from "geo-tz";
import { EnvVar, getEnvVarOrError } from "../../../helpers/envVars";

const oldExportSchema = z.object({
  locations: z.array(
    z.object({
      timestamp: z.string().datetime(),
      latitudeE7: z.number(),
      longitudeE7: z.number(),
      accuracy: z.number(),
      source: z.enum(["UNKNOWN", "WIFI", "VISIT_ARRIVAL", "VISIT_DEPARTURE", "GPS", "CELL"]).optional(),
      deviceDesignation: z.enum(["PRIMARY", "UNKNOWN"]).optional(),
      deviceTag: z.number(),
      activity: z
        .array(
          z.object({
            activity: z.array(
              z.object({
                type: z.enum([
                  "UNKNOWN",
                  "STILL",
                  "IN_VEHICLE",
                  "IN_ROAD_VEHICLE",
                  "IN_RAIL_VEHICLE",
                  "WALKING",
                  "RUNNING",
                  "ON_BICYCLE",
                  "ON_FOOT",
                  "TILTING",
                  "EXITING_VEHICLE",
                  "IN_FOUR_WHEELER_VEHICLE",
                  "IN_TWO_WHEELER_VEHICLE",
                  "IN_CAR",
                  "IN_BUS",
                ]),
                confidence: z.number(),
              }),
            ),
            timestamp: z.string().datetime(),
          }),
        )
        .optional(),
    }),
  ),
});
export class GoogleTakeoutLocationsImporter extends BaseImporter {
  override sourceId = "google-takeout-locations-export";
  override destinationTable = "locations";
  override entryDateKey = "";
  private sourceName = "google_new" as const;

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: Date;
    totalEstimate?: number;
  }> {
    return { result: true };
  }
  public async import(params: {
    tx: DBTransaction;
    placeholderJobId: number;
  }): Promise<{
    importedCount: number;
    firstEntryDate: Date;
    lastEntryDate: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    await params.tx.delete(locationsTable).where(sql`source = ${this.sourceName}`);
    const { importedCount, logs: exportLogs } = await this.handleExport(params);
    const { deletedCount, logs: cleanupLogs } = await this.cleanupInaccurateLocations(params);
    return {
      importedCount: importedCount - deletedCount,
      firstEntryDate: new Date(),
      lastEntryDate: new Date(),
      logs: exportLogs.concat(cleanupLogs),
    };
  }

  private isLatInBounds(lat: number) {
    return lat < -90 || lat > 90;
  }

  private isLngInBounds(lng: number) {
    return lng < -180 || lng > 180;
  }

  private e7ToDecimal(e7: number) {
    return e7 / 1e7;
  }

  private async handleExport(params: {
    tx: DBTransaction;
    placeholderJobId: number;
  }): Promise<{
    importedCount: number;
    logs: string[];
  }> {
    const path = getEnvVarOrError(EnvVar.GOOGLE_TAKEOUT_RECORDS_JSON);
    const dataJson = await import(path);
    let importedCount = 0;
    const exportData = await oldExportSchema.safeParseAsync(dataJson);

    if (!exportData.data) {
      throw new Error(`Failed to parse JSON: ${JSON.stringify(exportData.error?.errors.splice(0, 10))}`);
    }

    const logs: string[] = [];

    for (const location of exportData.data.locations ?? []) {
      const lat = this.e7ToDecimal(location.latitudeE7);
      const lng = this.e7ToDecimal(location.longitudeE7);

      if (this.isLatInBounds(lat) || this.isLngInBounds(lng)) {
        logs.push(`Lat or Lng out of bounds in entry: ${location.latitudeE7 / 1e7}, ${location.longitudeE7 / 1e7}`);
        continue;
      }

      const timezone = find(lat, lng)[0];

      await params.tx
        .insert(locationsTable)
        .values([
          {
            source: this.sourceName,
            accuracy: location.accuracy,
            topic: String(location.deviceTag),
            timezone,
            location: {
              lat,
              lng,
            },
            locationFix: DateTime.fromISO(location.timestamp).toJSDate(),
            importJobId: params.placeholderJobId,
          },
        ])
        .returning({ id: locationsTable.id });

      importedCount += 1;
    }

    return { importedCount, logs };
  }

  /**
   * I've found that in my google takeout, there were many inaccurate location in the records.json file.
   * They were mostly in the middle of the ocean. I've looked into tickets like these:
   * https://gis.stackexchange.com/questions/318918/latitude-and-longitude-values-in-google-takeout-location-history-data-sometimes
   * But that didn't seem to be my problem. The coordinates were just completely wrong.
   *
   * The method that I'm trying to use here (and that is very inneficient and might cause problems for very big files)
   * is:
   * - For every entry, at other entries recorded within 10min
   * - Get the median value of the distance to every point
   * - If the median is > 200km, discard the point
   *
   * I have to do this as a second step after importing all of them to properly get the median value.
   *
   * 200km is a very safe value because to travel 200km in 10min we would have to be going VERY fast :)
   */
  private async cleanupInaccurateLocations(params: {
    tx: DBTransaction;
  }): Promise<{ logs: string[]; deletedCount: number }> {
    const logs: string[] = [];
    let deletedCount = 0;
    let currentOffset = 0;
    const batchSize = 1000;
    const filterAssumptions = {
      // 10min
      timeBetweenPoints: "10 min",
      // Max distance
      maxDistanceInKm: 200,
    };

    const totalPointsToInpect = await params.tx
      .select({
        count: sql`count(*)`.mapWith(Number),
      })
      .from(locationsTable)
      .where(sql`source = ${this.sourceName}`)
      .then((r) => r[0]?.count);

    do {
      console.log(`Looking for inaccurate points ${currentOffset}/${totalPointsToInpect}`);
      const pointsToInspect = await params.tx
        .select({
          id: locationsTable.id,
        })
        .from(locationsTable)
        .where(sql`source = ${this.sourceName}`)
        .orderBy(locationsTable.locationFix)
        .limit(batchSize)
        .offset(currentOffset);

      if (pointsToInspect.length === 0) {
        console.log("Finished looking for inaccurate points");
        break;
      }

      const googleLocations = params.tx
        .$with("google_locations")
        .as((cte) => cte.select().from(locationsTable).where(sql`source = ${this.sourceName}`));
      // Struggled to find a way to alias googleLocations so I'm just duplicating the
      // CTE
      const lJoin = params.tx
        .$with("l_locations")
        .as((cte) => cte.select().from(locationsTable).where(sql`source = ${this.sourceName}`));
      const result = await params.tx
        .with(googleLocations, lJoin)
        .select({
          id: googleLocations.id,
          location: googleLocations.location,
          median: sql`percentile_cont(0.5) within group (
                    order by ST_Distance(${googleLocations.location}::geography, ${lJoin.location}::geography)
                ) / 1000`.mapWith(Number),
          count: sql`count(${lJoin.id})`.mapWith(Number),
        })
        .from(googleLocations)
        .leftJoin(
          lJoin,
          sql`
            ${lJoin.locationFix} > ${
              googleLocations.locationFix
            } - INTERVAL '${sql.raw(filterAssumptions.timeBetweenPoints)}' AND
             ${lJoin.locationFix} < ${
               googleLocations.locationFix
             } + INTERVAL '${sql.raw(filterAssumptions.timeBetweenPoints)}' AND
             ${lJoin.id} != ${googleLocations.id}`,
        )
        .where(sql`${googleLocations.id} IN ${pointsToInspect.map((p) => p.id)}`)
        .groupBy(googleLocations.location, googleLocations.id);

      const toDelete = result.filter((r) => r.median > filterAssumptions.maxDistanceInKm);
      const faultyIds = toDelete.map((r) => r.id);

      logs.push(`Faulty locations found: ${JSON.stringify(toDelete)}`);
      deletedCount += faultyIds.length;

      if (faultyIds.length > 0) {
        await params.tx.delete(locationsTable).where(sql`id IN ${faultyIds}`);
      }

      currentOffset += batchSize;
      // biome-ignore lint/correctness/noConstantCondition: <explanation>
    } while (true);

    return { logs, deletedCount };
  }
}

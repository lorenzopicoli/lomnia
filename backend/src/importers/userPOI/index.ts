import { and, eq, sql } from "drizzle-orm";
import type { DateTime } from "luxon";
import { z } from "zod";
import config from "../../config";
import { type DBTransaction, toPostgisGeoPoint } from "../../db/types";
import { locationsTable } from "../../models";
import { locationDetailsTable } from "../../models/LocationDetails";
import { BaseImporter } from "../BaseImporter";

// import data from "./personal.json";

const jsonSchema = z.array(
  z
    .object({
      name: z.string(),
      displayName: z.string(),
      lat: z.number(),
      lng: z.number(),
      radiusInMeters: z.number(),

      building: z.string(),
      ISO3166_2_lvl4: z.string(),
      houseNumber: z.string(),
      road: z.string(),
      neighbourhood: z.string(),
      suburb: z.string(),
      city: z.string(),
      county: z.string(),
      region: z.string(),
      state: z.string(),
      postcode: z.string(),
      country: z.string(),
      countryCode: z.string(),
    })
    .partial()
    .required({
      name: true,
      displayName: true,
      lat: true,
      lng: true,
      radiusInMeters: true,
    }),
);

type PointOfInterest = z.infer<typeof jsonSchema>[number];

/**
 * Warning: changing a POI to cover less area or deleting POIs requires recalculateAll to be true otherwise
 * the old POI location will be dangling
 */
export class UserPointsOfInterestImporter extends BaseImporter {
  override sourceId = "userPOIJson" as const;
  override destinationTable = "location_details";
  override entryDateKey = "";

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    // Should probably store a hash of the last file and skip it altogether if the file hasn't changed,
    // but we should also be avoiding recaulculation by checking the location details in the DB
    return { result: true };
  }

  public async import(params: { tx: DBTransaction; placeholderJobId: number }): Promise<{
    importedCount: number;
    firstEntryDate: Date;
    lastEntryDate: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    const { tx, placeholderJobId } = params;
    let importedCount = 0;

    const userPOIs = jsonSchema.parse([]);

    if (config.importers.locationDetails.userPoi.recalculateAll) {
      // Delete all the user point of interests from the location details table
      // This automatically sets locationDetailsId to null in locations
      await tx.delete(locationDetailsTable).where(eq(locationDetailsTable.source, this.sourceId));
    }

    for (const poi of userPOIs) {
      await this.handlePointOfInterest({ tx, poi, placeholderJobId });

      importedCount += 1;
    }

    await tx.delete(locationDetailsTable).where(
      and(
        eq(locationDetailsTable.source, this.sourceId),
        sql`NOT EXISTS (
        SELECT 1 FROM ${locationsTable}
        WHERE ${locationsTable.locationDetailsId} = ${locationDetailsTable.id}
      )`,
      ),
    );
    return {
      importedCount,
      firstEntryDate: new Date(),
      lastEntryDate: new Date(),
      logs: [],
    };
  }

  private async handlePointOfInterest(params: { tx: DBTransaction; poi: PointOfInterest; placeholderJobId: number }) {
    const { poi, tx, placeholderJobId } = params;
    this.logger.debug("Updating locations for place of interest", {
      poi,
    });
    const { lat, lng, radiusInMeters, ...rest } = poi;
    const existing = await tx
      .select()
      .from(locationDetailsTable)
      .where(sql`
        ${locationDetailsTable.source} = ${this.sourceId}
        AND ${locationDetailsTable.radius} = ${radiusInMeters}
        AND ST_DWithin(
            ${locationDetailsTable.location},
            ${toPostgisGeoPoint({ lat, lng })},
            2
          )
        `);

    if (existing[0]) {
      this.logger.debug("POI already exists and hasn't changed", {
        poi,
      });
    }

    const locationDetailsId =
      existing.length > 0
        ? { id: existing[0].id }
        : await tx
            .insert(locationDetailsTable)
            .values({
              location: { lat, lng },
              source: this.sourceId,
              importJobId: placeholderJobId,
              radius: radiusInMeters,
              ...rest,
            })
            .returning({ id: locationDetailsTable.id })
            .then((r) => r[0]);

    // Might be overwritting locations that had their details set by external sources. That's fine since we
    // give preference to the user POIs
    await tx
      .update(locationsTable)
      .set({ locationDetailsId: locationDetailsId.id })
      .where(
        sql`
            ST_DWithin(
              ${locationsTable.location},
              ${toPostgisGeoPoint({ lat, lng })},
              ${radiusInMeters})
            AND 
            ${existing.length === 0 ? sql`1=1` : sql`${locationsTable.locationDetailsId} IS NULL`}
          `,
      );
  }
}

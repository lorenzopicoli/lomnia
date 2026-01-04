import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import config from "../../../config";
import { type DBTransaction, toPostgisGeoPoint } from "../../../db/types";
import { locationsTable } from "../../../models";
import { locationDetailsTable } from "../../../models/LocationDetails";
import { Logger } from "../../Logger";
import { BaseEnricher } from "../BaseEnricher";

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
export class PointsOfInterestEnricher extends BaseEnricher {
  private sourceId = "userPOIJson" as const;
  protected logger = new Logger("PointsOfInterestEnricher");

  public isEnabled(): boolean {
    return config.importers.locationDetails.userPoi.enabled;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    const userPOIs = jsonSchema.parse([]);

    if (config.importers.locationDetails.userPoi.recalculateAll) {
      // Delete all the user point of interests from the location details table
      // This automatically sets locationDetailsId to null in locations
      await tx.delete(locationDetailsTable).where(eq(locationDetailsTable.source, this.sourceId));
    }

    for (const poi of userPOIs) {
      await this.handlePointOfInterest({ tx, poi });
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
  }

  private async handlePointOfInterest(params: { tx: DBTransaction; poi: PointOfInterest }) {
    const { poi, tx } = params;
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

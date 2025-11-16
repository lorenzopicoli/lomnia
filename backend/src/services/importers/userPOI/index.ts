import { BaseImporter } from "../BaseImporter";
import { toPostgisGeoPoint, type DBTransaction } from "../../../db/types";
import { z } from "zod";
import data from "./personal.json";
import { locationsTable } from "../../../models";
import { eq, sql } from "drizzle-orm";
import { locationDetailsTable } from "../../../models/LocationDetails";
import type { DateTime } from "luxon";

export class UserPointsOfInterestImporter extends BaseImporter {
  override sourceId = "userPOIJson";
  override destinationTable = "location_details";
  override entryDateKey = "";

  private jsonSchema = z.array(
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

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    // Simply always re-write user's point of interests
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

    const userPOIs = this.jsonSchema.parse(data);

    // Delete all the user point of interests from the location details table
    // This automatically sets locationDetailsId to null in locations
    await tx.delete(locationDetailsTable).where(eq(locationDetailsTable.source, "userPOIJson"));

    for (const poi of userPOIs) {
      console.log(`Updating locations for place of interest: ${poi.displayName}`);
      const { lat, lng, radiusInMeters, ...rest } = poi;
      const locationDetailsId = await tx
        .insert(locationDetailsTable)
        .values({
          location: { lat, lng },
          source: "userPOIJson",
          importJobId: placeholderJobId,
          ...rest,
        })
        .returning({ id: locationDetailsTable.id });
      if (!locationDetailsId[0]) {
        throw new Error("No location details id");
      }
      // Might be overwritting locations that had their details set by external sources. That's fine since we
      // give preference to the user POIs
      await tx
        .update(locationsTable)
        .set({ locationDetailsId: locationDetailsId[0].id })
        .where(
          sql`
          ST_DWithin(
            ${locationsTable.location},
            ${toPostgisGeoPoint({ lat, lng })},
            ${poi.radiusInMeters}
          )`,
        );
      importedCount += 1;
    }

    return {
      importedCount,
      firstEntryDate: new Date(),
      lastEntryDate: new Date(),
      logs: [],
    };
  }
}

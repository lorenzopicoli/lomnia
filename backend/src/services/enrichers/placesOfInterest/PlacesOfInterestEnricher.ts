import { sql } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { locationsTable } from "../../../models";
import { type PlaceOfInterest, placesOfInterestTable } from "../../../models/PlaceOfInterest";
import { Logger } from "../../Logger";
import { BaseEnricher } from "../BaseEnricher";

export class PlacesOfInterestEnricher extends BaseEnricher {
  protected logger = new Logger("PlacesOfInterestEnricher");

  public isEnabled(): boolean {
    return true;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    const userPOIs = await tx.select().from(placesOfInterestTable);

    for (const poi of userPOIs) {
      await this.handlePlaceOfInterest({ tx, poi });
    }
  }

  private async handlePlaceOfInterest(params: { tx: DBTransaction; poi: PlaceOfInterest }) {
    const { poi, tx } = params;
    this.logger.info("Updating locations for place of interest", {
      id: poi.id,
      name: poi.name,
      locationDetailsId: poi.locationDetailsId,
    });

    const { id, locationDetailsId } = poi;
    await tx
      .update(locationsTable)
      .set({
        locationDetailsId,
      })
      .from(placesOfInterestTable)
      .where(sql`
        ${placesOfInterestTable.id} = ${id} AND
        ${locationsTable.locationDetailsId} IS NULL AND
        ST_Contains(
            ${placesOfInterestTable.polygon},
            ${locationsTable.location}::geometry
          )
        `);
    await tx
      .update(locationsTable)
      .set({
        locationDetailsId: null,
      })
      .from(placesOfInterestTable)
      .where(sql`
        ${placesOfInterestTable.id} = ${id} AND
        ${locationsTable.locationDetailsId} = ${locationDetailsId} AND
        NOT ST_Contains(
            ${placesOfInterestTable.polygon},
            ${locationsTable.location}::geometry
          )
        `);
  }
}

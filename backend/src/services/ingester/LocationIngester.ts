import type { DBTransaction } from "../../db/types";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionLocation from "../../ingestionSchemas/IngestionLocation";
import type { NewLocation } from "../../models/Location";
import { Ingester } from "./BaseIngester";

export class LocationIngester extends Ingester<IngestionLocation> {
  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionLocation } {
    const location = ingestionSchemas.location.safeParse(raw);

    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }

  private transform(raw: IngestionLocation): NewLocation {
    const transformed: NewLocation = {
      externalId: raw.id,

      gpsSource: raw.gpsSource,
      source: raw.source,
      accuracy: raw.accuracy,
      verticalAccuracy: raw.verticalAccuracy,
      velocity: raw.velocity,
      altitude: raw.altitude,
      location: raw.location,
      trigger: raw.trigger,
      topic: raw.topic,
      timezone: raw.timezone,
      importJobId: this.importJobId,
      locationFix: new Date(raw.recordedAt),

      rawData: raw,
    };

    return transformed;
  }

  public async tryIngest(tx: DBTransaction, raw: unknown): Promise<void> {
    const { isIngestable, parsed } = this.isIngestable(raw);

    if (isIngestable && parsed) {
      await this.ingest(tx, parsed);
    }
  }

  public async ingest(_tx: DBTransaction, parsed: IngestionLocation) {
    const newLocation = this.transform(parsed);
    console.log("New location ready to insert", newLocation);
    // await tx.insert(locationsTable).values(newLocation);
  }
}

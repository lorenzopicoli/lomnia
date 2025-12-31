import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionLocation from "../../ingestionSchemas/IngestionLocation";
import { locationsTable, type NewLocation } from "../../models/Location";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class LocationIngester extends Ingester<IngestionLocation, NewLocation> {
  protected logger = new Logger("LocationIngester");

  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionLocation } {
    const location = ingestionSchemas.location.safeParse(raw);
    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }

  transform(raw: IngestionLocation): NewLocation {
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
      recordedAt: new Date(raw.recordedAt),
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    await this.tx.insert(locationsTable).values(this.collected);
  }
}

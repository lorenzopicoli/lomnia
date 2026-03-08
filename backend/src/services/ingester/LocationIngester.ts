import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionLocation from "../../ingestionSchemas/IngestionLocation";
import { locationsTable, type NewLocation } from "../../models/Location";
import type { Exhaustive } from "../../types/exhaustive";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class LocationIngester extends Ingester<IngestionLocation, NewLocation> {
  protected logger = new Logger("LocationIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionLocation;
  } {
    const location = ingestionSchemas.location.safeParse(raw);
    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }
  transform(raw: IngestionLocation): NewLocation {
    const {
      id,
      gpsSource,
      source,
      accuracy,
      verticalAccuracy,
      velocity,
      altitude,
      location,
      trigger,
      topic,
      timezone,
      recordedAt,
      // Unused
      entityType: _type,
      version: _version,
      deviceId: _deviceId,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewLocation = {
      externalId: id,

      gpsSource,
      source,
      accuracy,
      verticalAccuracy,
      velocity,
      altitude,
      location,
      trigger,
      topic,
      timezone,

      importJobId: this.importJobId,
      recordedAt: new Date(recordedAt),
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(locationsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(locationsTable).values(this.collected).onConflictDoUpdate({
      target: locationsTable.externalId,
      set: updateOnConflict,
    });
  }
}

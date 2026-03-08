import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionHeartRate from "../../ingestionSchemas/IngestionHeartRate";
import { heartRateTable, type NewHeartRate } from "../../models/HeartRate";
import type { Exhaustive } from "../../types/exhaustive";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class HeartRateIngester extends Ingester<IngestionHeartRate, NewHeartRate> {
  protected logger = new Logger("SleepIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionHeartRate;
  } {
    const heartRate = ingestionSchemas.heartRate.safeParse(raw);
    return {
      isIngestable: heartRate.success,
      parsed: heartRate.data,
    };
  }

  transform(raw: IngestionHeartRate): NewHeartRate {
    const {
      id,
      startedAt,
      endedAt,
      recordedAt,
      source,
      deviceId,
      heartRate,
      heartRateMax,
      heartRateMin,
      timezone,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewHeartRate = {
      externalId: id,

      startedAt: new Date(startedAt ?? recordedAt),
      endedAt: new Date(endedAt ?? recordedAt),
      recordedAt: new Date(recordedAt),

      timezone,
      importJobId: this.importJobId,
      source,

      externalDeviceId: deviceId,

      heartRate,
      heartRateMax,
      heartRateMin,

      createdAt: new Date(),
      updatedAt: null,
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(heartRateTable, ["importJobId", "createdAt"]);
    await this.tx.insert(heartRateTable).values(this.collected).onConflictDoUpdate({
      target: heartRateTable.externalId,
      set: updateOnConflict,
    });
  }
}

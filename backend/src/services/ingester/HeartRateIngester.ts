import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionHeartRate from "../../ingestionSchemas/IngestionHeartRate";
import { heartRateTable, type NewHeartRate } from "../../models/HeartRate";
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
    const transformed: NewHeartRate = {
      externalId: raw.id,

      startedAt: new Date(raw.startedAt ?? raw.recordedAt),
      endedAt: new Date(raw.endedAt ?? raw.recordedAt),
      recordedAt: new Date(raw.recordedAt),

      timezone: null,
      importJobId: this.importJobId,
      source: raw.source,

      externalDeviceId: raw.deviceId,

      heartRate: raw.heartRate,
      heartRateMax: raw.heartRateMax,
      heartRateMin: raw.heartRateMin,

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

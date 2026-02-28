import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionSleepStage from "../../ingestionSchemas/IngestionSleepStage";
import { sleepStagesTable } from "../../models";
import type { NewSleepStage } from "../../models/SleepStage";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class SleepStageIngester extends Ingester<IngestionSleepStage, NewSleepStage> {
  protected logger = new Logger("SleepStageIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionSleepStage;
  } {
    const location = ingestionSchemas.sleepStage.safeParse(raw);
    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }

  transform(raw: IngestionSleepStage): NewSleepStage {
    const transformed: NewSleepStage = {
      externalId: raw.id,

      startedAt: new Date(raw.startedAt),
      endedAt: new Date(raw.endedAt),

      timezone: null,
      importJobId: this.importJobId,
      source: raw.source,
      sleepId: raw.sleepId,
      stage: raw.type,
      externalDeviceId: raw.deviceId,

      createdAt: new Date(),
      updatedAt: null,
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(sleepStagesTable, ["importJobId", "createdAt"]);
    await this.tx.insert(sleepStagesTable).values(this.collected).onConflictDoUpdate({
      target: sleepStagesTable.externalId,
      set: updateOnConflict,
    });
  }
}

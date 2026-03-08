import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionSleepStage from "../../ingestionSchemas/IngestionSleepStage";
import { sleepStagesTable } from "../../models";
import type { NewSleepStage } from "../../models/SleepStage";
import type { Exhaustive } from "../../types/exhaustive";
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
    const {
      id,
      startedAt,
      endedAt,
      source,
      sleepId,
      type,
      deviceId,
      timezone,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewSleepStage = {
      externalId: id,

      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),

      timezone,
      importJobId: this.importJobId,
      source,
      sleepId,
      stage: type,
      externalDeviceId: deviceId,

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

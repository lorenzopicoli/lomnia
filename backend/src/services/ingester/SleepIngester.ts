import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionSleep from "../../ingestionSchemas/IngestionSleep";
import { type NewSleep, sleepsTable } from "../../models/Sleep";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class SleepIngester extends Ingester<IngestionSleep, NewSleep> {
  protected logger = new Logger("SleepIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionSleep;
  } {
    const sleep = ingestionSchemas.sleep.safeParse(raw);
    return {
      isIngestable: sleep.success,
      parsed: sleep.data,
    };
  }

  transform(raw: IngestionSleep): NewSleep {
    const transformed: NewSleep = {
      externalId: raw.id,

      startedAt: new Date(raw.startedAt),
      endedAt: new Date(raw.endedAt),

      timezone: null,
      isManuallyRecorded: false,
      importJobId: this.importJobId,
      source: raw.source,
      comment: raw.comment,
      automaticScore: raw.automaticScore,
      userScore: raw.userScore,

      externalDeviceId: raw.deviceId,

      createdAt: new Date(),
      updatedAt: null,
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(sleepsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(sleepsTable).values(this.collected).onConflictDoUpdate({
      target: sleepsTable.externalId,
      set: updateOnConflict,
    });
  }
}

import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionSleep from "../../ingestionSchemas/IngestionSleep";
import { type NewSleep, sleepsTable } from "../../models/Sleep";
import type { Exhaustive } from "../../types/exhaustive";
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
    const {
      id,
      startedAt,
      endedAt,
      source,
      comment,
      automaticScore,
      userScore,
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

    const transformed: NewSleep = {
      externalId: id,

      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),

      isManuallyRecorded: false,
      importJobId: this.importJobId,
      source,
      comment,
      automaticScore,
      userScore,
      timezone,

      externalDeviceId: deviceId,

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

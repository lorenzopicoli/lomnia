import { eq, isNull } from "drizzle-orm";
import { db } from "../../../db/connection";
import type { DBTransaction } from "../../../db/types";
import { sleepStagesTable } from "../../../models";
import { Logger } from "../../Logger";
import { BaseTimezoneEnricher } from "./BaseTimezoneEnricher";

export class SleepStageTimezoneEnricher extends BaseTimezoneEnricher {
  protected logger = new Logger("SleepStageTimezoneEnricher");

  override async updateItem(tx: DBTransaction, id: number, timezone: string): Promise<void> {
    await tx.update(sleepStagesTable).set({ timezone }).where(eq(sleepStagesTable.id, id));
  }
  override async getPage() {
    const result = await db
      .select({ id: sleepStagesTable.id, date: sleepStagesTable.startedAt })
      .from(sleepStagesTable)
      .where(isNull(sleepStagesTable.timezone))
      .offset(this.page * this.pageSize)
      .limit(this.pageSize);
    this.currentPage = result;
    return result.length > 0;
  }
}

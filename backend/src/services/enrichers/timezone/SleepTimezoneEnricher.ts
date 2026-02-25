import { eq, isNull } from "drizzle-orm";
import { db } from "../../../db/connection";
import type { DBTransaction } from "../../../db/types";
import { sleepsTable } from "../../../models/Sleep";
import { Logger } from "../../Logger";
import { BaseTimezoneEnricher } from "./BaseTimezoneEnricher";

export class SleepTimezoneEnricher extends BaseTimezoneEnricher {
  protected logger = new Logger("SleepTimezoneEnricher");

  override async updateItem(tx: DBTransaction, id: number, timezone: string): Promise<void> {
    await tx.update(sleepsTable).set({ timezone }).where(eq(sleepsTable.id, id));
  }
  override async getPage() {
    const result = await db
      .select({ id: sleepsTable.id, date: sleepsTable.startedAt })
      .from(sleepsTable)
      .where(isNull(sleepsTable.timezone))
      .offset(this.page * this.pageSize)
      .limit(this.pageSize);
    this.currentPage = result;
    return result.length > 0;
  }
}

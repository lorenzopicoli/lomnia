import { asc, eq, isNull } from "drizzle-orm";
import { db } from "../../../db/connection";
import type { DBTransaction } from "../../../db/types";
import { websitesVisitsTable } from "../../../models/WebsiteVisit";
import { Logger } from "../../Logger";
import { BaseTimezoneEnricher } from "./BaseTimezoneEnricher";

export class WebsiteVisitTimezoneEnricher extends BaseTimezoneEnricher {
  protected logger = new Logger("WebsiteVisitTimezoneEnricher");

  override async updateItem(tx: DBTransaction, id: number, timezone: string): Promise<void> {
    await tx.update(websitesVisitsTable).set({ timezone }).where(eq(websitesVisitsTable.id, id));
  }
  override async getPage() {
    const result = await db
      .select({ id: websitesVisitsTable.id, date: websitesVisitsTable.recordedAt })
      .from(websitesVisitsTable)
      .where(isNull(websitesVisitsTable.timezone))
      .orderBy(asc(websitesVisitsTable.recordedAt))
      .offset(this.page * this.pageSize)
      .limit(this.pageSize);
    this.currentPage = result;
    return result.length > 0;
  }
}

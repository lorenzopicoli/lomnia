import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import config from "../config";
import { db } from "../db/connection";
import { websitesTable } from "../models/Website";
import { websitesVisitsTable } from "../models/WebsiteVisit";
import type { DateRange } from "../types/chartTypes";

class BrowserHistoryChartServiceInternal {
  public async getWebsitesCount() {
    return db
      .select({
        count: count(),
      })
      .from(websitesTable)
      .then((r) => r[0].count);
  }

  public async getWebsitesVisitsCount() {
    return db
      .select({
        count: count(),
      })
      .from(websitesVisitsTable)
      .then((r) => r[0].count);
  }

  public async getMostVisitedPages(params: DateRange) {
    const { start, end } = params;
    const filterOutLocalhost = config.charts.browserHistory.filterOutLocalhost
      ? sql`${websitesTable.url} NOT ILIKE 'http://localhost%'`
      : sql`1=1`;
    return db
      .select({
        title: websitesTable.title,
        url: websitesTable.url,
        visits: count(websitesVisitsTable.id),
      })
      .from(websitesVisitsTable)
      .innerJoin(websitesTable, eq(websitesTable.externalId, websitesVisitsTable.websiteExternalId))
      .where(
        and(
          gte(websitesVisitsTable.recordedAt, start.toJSDate()),
          lte(websitesVisitsTable.recordedAt, end.toJSDate()),
          filterOutLocalhost,
        ),
      )
      .groupBy(websitesTable.id)
      .orderBy(desc(count(websitesVisitsTable.id)))
      .limit(config.charts.browserHistory.limit);
  }
}

export const BrowserHistoryChartService = new BrowserHistoryChartServiceInternal();

import { and, count, desc, eq, gte, isNotNull, lte, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
      .limit(config.charts.browserHistory.mostVisited.limit);
  }

  public async getMostVisitedHosts(params: DateRange) {
    const { start, end } = params;
    const filterOutLocalhost = config.charts.browserHistory.filterOutLocalhost
      ? sql`${websitesTable.url} NOT ILIKE 'http://localhost%'`
      : sql`1=1`;
    return db
      .select({
        host: websitesTable.host,
        visits: count(websitesTable.host),
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
      .groupBy(websitesTable.host)
      .orderBy(desc(count(websitesVisitsTable.id)))
      .limit(config.charts.browserHistory.mostVisited.limit);
  }

  public async dailyVisits(params: DateRange) {
    const { start, end } = params;
    return db
      .select({
        day: sql`(${websitesVisitsTable.recordedAt} AT TIME ZONE ${websitesVisitsTable.timezone})::date`
          .mapWith(String)
          .as("day"),
        // .mapWith(String),
        visits: count(websitesVisitsTable.id),
      })
      .from(websitesVisitsTable)
      .where(
        and(gte(websitesVisitsTable.recordedAt, start.toJSDate()), lte(websitesVisitsTable.recordedAt, end.toJSDate())),
      )
      .groupBy(sql`(${websitesVisitsTable.recordedAt} AT TIME ZONE ${websitesVisitsTable.timezone})::date`)
      .orderBy(sql`day ASC`);
  }

  public async websitesNavigationFlow(params: DateRange) {
    const { start, end } = params;
    const prevWebsitesTable = alias(websitesTable, "prev_w");
    const currWebsitesTable = alias(websitesTable, "curr_w");
    const prevVisitsTable = alias(websitesVisitsTable, "prev");
    const edgesCte = db.$with("edges").as((cte) =>
      cte
        .select({
          source: sql`${prevWebsitesTable.host}`.as("source_host"),
          target: sql`${currWebsitesTable.host}`.as("target_host"),
        })
        .from(websitesVisitsTable)
        .innerJoin(prevVisitsTable, eq(websitesVisitsTable.fromVisitExternalId, prevVisitsTable.externalId))
        .innerJoin(currWebsitesTable, eq(currWebsitesTable.externalId, websitesVisitsTable.websiteExternalId))
        .innerJoin(prevWebsitesTable, eq(prevWebsitesTable.externalId, prevVisitsTable.websiteExternalId))
        .where(
          and(
            isNotNull(prevWebsitesTable.host),
            isNotNull(currWebsitesTable.host),
            ne(prevWebsitesTable.host, currWebsitesTable.host),

            gte(websitesVisitsTable.recordedAt, start.toJSDate()),
            lte(websitesVisitsTable.recordedAt, end.toJSDate()),
          ),
        ),
    );

    return db
      .with(edgesCte)
      .select({
        source: edgesCte.source,
        target: edgesCte.target,
        weight: count(),
      })
      .from(edgesCte)
      .groupBy(edgesCte.source, edgesCte.target)
      .having(sql`COUNT(*) >= 10`)
      .orderBy(sql`${count()} DESC`)
      .limit(config.charts.browserHistory.navigationFlow.limit);
  }
}

export const BrowserHistoryChartService = new BrowserHistoryChartServiceInternal();

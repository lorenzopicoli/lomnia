import { asc, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { heartRateTable } from "../models/HeartRate";
import type { ChartPeriodInput, DateRange } from "../types/chartTypes";
import { getAggregatedXColumn } from "./common/getAggregatedXColumn";
import { getAggregatedYColumn } from "./common/getAggregatedYColumn";

export namespace HeartRateService {
  export const getForPeriod = async (params: DateRange) => {
    const { start, end } = params;
    const data = db
      .select({
        heartRate: heartRateTable.heartRate,
        date: heartRateTable.recordedAt,
      })
      .from(heartRateTable)
      .where(
        sql`
      ${heartRateTable.recordedAt} >= ${start.toISO()}
      AND ${heartRateTable.recordedAt} <= ${end.toISO()}`,
      )
      .orderBy(asc(heartRateTable.recordedAt));

    return data;
  };
}
export namespace HeartRateChartService {
  export const minMaxAvg = async (params: ChartPeriodInput) => {
    const { start, end, aggregationPeriod } = params;
    const aggregatedDate = getAggregatedXColumn(heartRateTable.recordedAt, aggregationPeriod);
    const data = db
      .select({
        max: getAggregatedYColumn(heartRateTable.heartRate, "max").mapWith(Number),
        min: getAggregatedYColumn(heartRateTable.heartRate, "min").mapWith(Number),
        median: getAggregatedYColumn(heartRateTable.heartRate, "median").mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(heartRateTable)
      .where(
        sql`
      ${heartRateTable.recordedAt} >= ${start.toISO()}
      AND ${heartRateTable.recordedAt} <= ${end.toISO()}`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };
}

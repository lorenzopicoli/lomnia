import { asc, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { heartRateTable } from "../models/HeartRate";
import type { ChartPeriodInput } from "../types/chartTypes";
import { getAggregatedXColumn } from "./common/getAggregatedXColumn";
import { getAggregatedYColumn } from "./common/getAggregatedYColumn";

export namespace HeartRateChartService {
  export const minMaxAvg = async (params: ChartPeriodInput) => {
    const { start, end, aggregationPeriod } = params;
    const aggregatedDate = getAggregatedXColumn(heartRateTable.startTime, aggregationPeriod);
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
      ${heartRateTable.startTime} >= (${start.toISO()} AT TIME ZONE ${heartRateTable.timezone})::date 
      AND ${heartRateTable.startTime} <= (${end.toISO()} AT TIME ZONE ${heartRateTable.timezone})::date`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };
}

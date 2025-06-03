import { asc, sql, type SQL } from "drizzle-orm";
import { getKeys } from "../helpers/getKeys";
import { heartRateTable, type HeartRateColumns } from "../models/HeartRate";
import { getAggregatedXColumn, getAggregatedYColumn, getMinMaxChart } from "./charts/charts";
import type { ChartServiceParams, ChartServiceReturn } from "./charts/types";
import { db } from "../db/connection";

export const getHeartRateCharts = async (params: ChartServiceParams): ChartServiceReturn => {
  const { yKeys, xKey, filters, aggregation } = params;
  const columns = getKeys(heartRateTable);
  const isSafeXKey = columns.includes(xKey as (typeof columns)[number]);
  const isSafeYKeys = yKeys.every((yKey) => columns.includes(yKey as (typeof columns)[number]));

  if (!isSafeXKey || !isSafeYKeys) {
    throw new Error("Invalid keys");
  }
  const xKeyTyped = xKey as HeartRateColumns;
  const yKeysTyped = yKeys as HeartRateColumns[];
  const xCol = getAggregatedXColumn(heartRateTable[xKeyTyped], aggregation);
  const yCols = yKeysTyped.reduce(
    (acc, curr) => {
      acc[curr] = getAggregatedYColumn(heartRateTable[curr], aggregation).mapWith(Number);
      return acc;
    },
    {} as Record<HeartRateColumns, SQL>,
  );

  const data = db
    .select({
      ...yCols,
      [xKey]: xCol,
    })
    .from(heartRateTable)
    .where(
      sql`
      ${heartRateTable.startTime} >= (${filters.startDate.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${heartRateTable.startTime} <= (${filters.endDate.toISO()} AT TIME ZONE 'America/Toronto')::date`,
    )
    .$dynamic();

  if (aggregation) {
    data.groupBy(sql`${xCol}`);
  }

  data.orderBy(asc(xCol));
  const result = await data;
  const formatted: Record<string, { x: number | Date | string; y: number }[]> = {};

  // Slow!
  for (const entry of result) {
    const x = entry[xKeyTyped] as string | number;
    for (const key of getKeys(entry)) {
      if (key === xKeyTyped) {
        continue;
      }
      if (!formatted[key]) {
        formatted[key] = [];
      }
      formatted[key].push({ x, y: entry[key] as number });
    }
  }

  return getMinMaxChart(formatted);
};

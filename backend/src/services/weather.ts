import { isValid, parse } from "date-fns";
import { asc, type SQL, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { getKeys } from "../helpers/getKeys";
import { dailyWeatherTable, type HourlyWeatherColumns, hourlyWeatherTable } from "../models";
import { getAggregatedXColumn, getAggregatedYColumn, getMinMaxChart } from "./charts/charts";
import type { ChartServiceParams, ChartServiceReturn } from "./charts/types";

export async function getWeatherInformation(params: { day: string }) {
  const { day } = params;
  if (!isValid(parse(day, "yyyy-MM-dd", new Date()))) {
    throw new Error("Invalid date");
  }
  const hourly = await db.query.hourlyWeatherTable.findMany({
    where: sql`(${hourlyWeatherTable.date} AT TIME ZONE ${hourlyWeatherTable.timezone})::date = ${day}`,
    orderBy: hourlyWeatherTable.date,
  });
  const daily = await db.query.dailyWeatherTable.findFirst({
    where: sql`${dailyWeatherTable.date} = ${day}`,
  });

  return {
    hourly,
    daily,
  };
}
export const getWeatherCharts = async (params: ChartServiceParams): ChartServiceReturn => {
  const { yKeys, xKey, filters, aggregation } = params;
  const columns = getKeys(hourlyWeatherTable);
  const isSafeXKey = columns.includes(xKey as (typeof columns)[number]);
  const isSafeYKeys = yKeys.every((yKey) => columns.includes(yKey as (typeof columns)[number]));

  if (!isSafeXKey || !isSafeYKeys) {
    throw new Error("Invalid keys");
  }
  const xKeyTyped = xKey as HourlyWeatherColumns;
  const yKeysTyped = yKeys as HourlyWeatherColumns[];
  const xCol = getAggregatedXColumn(hourlyWeatherTable[xKeyTyped], aggregation);
  const yCols = yKeysTyped.reduce(
    (acc, curr) => {
      acc[curr] = getAggregatedYColumn(hourlyWeatherTable[curr], aggregation).mapWith(Number);
      return acc;
    },
    {} as Record<HourlyWeatherColumns, SQL>,
  );

  const data = db
    .select({
      ...yCols,
      [xKey]: xCol,
    })
    .from(hourlyWeatherTable)
    .where(
      sql`
      ${hourlyWeatherTable.date} >= (${filters.startDate.toISO()} AT TIME ZONE ${hourlyWeatherTable.timezone})::date 
      AND ${hourlyWeatherTable.date} <= (${filters.endDate.toISO()} AT TIME ZONE ${hourlyWeatherTable.timezone})::date`,
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

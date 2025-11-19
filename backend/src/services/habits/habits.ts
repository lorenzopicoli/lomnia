import { isValid, parse } from "date-fns";
import { asc, sql } from "drizzle-orm";
import type { DateTime } from "luxon";
import { db } from "../../db/connection";
import { anonymize } from "../../helpers/anonymize";
import { getKeys } from "../../helpers/getKeys";
import { type Habit, type HabitColumns, habitsTable } from "../../models/Habit";
import { habitsNumericKeys } from "../charts/chartOptions";
import { getAggregatedXColumn, getAggregatedYColumn, getMinMaxChart } from "../charts/charts";
import type { AggregationPeriod, ChartServiceReturn, HabitChartServiceParams } from "../charts/types";
import type { HabitKeys } from "../importers/obsidian/personal";
import { habitLabel, habitTransformers } from "./personal";

export const formatHabitResponse = (habits: Habit[], shouldAnonymize: boolean): (Habit & { label: string })[] => {
  return habits
    .filter((h) => !!h.value)
    .map((h) => {
      const key = h.key as HabitKeys;
      const transformer = habitTransformers[key];
      const value = transformer ? transformer(h.value) : h.value;
      const label = habitLabel[h.key as HabitKeys];

      return {
        ...h,
        key: shouldAnonymize ? anonymize(key) : key,
        value: shouldAnonymize ? anonymize(value) : value,
        label: shouldAnonymize ? anonymize(label) : label,
      };
    });
};

export async function getHabits(params: { day: string; privateMode: boolean }) {
  const { day, privateMode } = params;
  if (!isValid(parse(day, "yyyy-MM-dd", new Date()))) {
    throw new Error("Invalid day");
  }
  const entries = await db.query.habitsTable.findMany({
    where: sql`date::date = ${day}`,
  });

  return formatHabitResponse(entries, privateMode);
}

export const getHabitsCharts = async (params: HabitChartServiceParams): ChartServiceReturn => {
  const { yKeys, xKey, filters, aggregation } = params;
  const columns = getKeys(habitsTable);
  const isSafeXKey = columns.includes(xKey as (typeof columns)[number]);

  if (!isSafeXKey) {
    throw new Error("Invalid keys");
  }
  const xKeyTyped = xKey as HabitColumns;
  const xCol = getAggregatedXColumn(habitsTable[xKeyTyped], aggregation?.period);
  const dateCol = getAggregatedXColumn(habitsTable.date, aggregation?.period);

  const data = db
    .select({
      key: habitsTable.key,
      value: getAggregatedYColumn(sql`${habitsTable.value}::integer`, aggregation?.fun).mapWith(Number),
      [xKey]: xCol,
    })
    .from(habitsTable)
    .where(
      sql`
      ${habitsTable.key} IN ${yKeys}
     AND
      ${dateCol} >= (${filters.startDate.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${dateCol} <= (${filters.endDate.toISO()} AT TIME ZONE 'America/Toronto')::date`,
    )
    .$dynamic();

  if (aggregation) {
    data.groupBy(sql`${xCol}, ${dateCol}, ${habitsTable.key}`);
  }

  data.orderBy(asc(xCol));
  const result = await data;
  const formatted: Record<string, { x: number | Date | string; y: number }[]> = {};

  // Slow!
  for (const entry of result) {
    const x = entry[xKeyTyped] as string | number;
    if (!formatted[entry.key]) {
      formatted[entry.key] = [];
    }
    formatted[entry.key].push({ x, y: entry.value as number });
  }

  return getMinMaxChart(formatted);
};

export const getNumberHabit = async (params: {
  startDate: DateTime;
  endDate: DateTime;
  period: AggregationPeriod;
  habitKey: string;
}) => {
  const supportedKeys = await habitsNumericKeys();

  if (!supportedKeys.find((k) => k.key === params.habitKey)) {
    return [];
  }

  const aggregatedDate = getAggregatedXColumn(habitsTable.date, params.period);
  const data = db
    .select({
      value: getAggregatedYColumn(sql`${habitsTable.value}::integer`, "sum").mapWith(Number),
      date: aggregatedDate.mapWith(String),
    })
    .from(habitsTable)
    .where(
      sql`
      ${habitsTable.key} = ${params.habitKey} AND
      ${habitsTable.date} >= (${params.startDate.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${habitsTable.date} <= (${params.endDate.toISO()} AT TIME ZONE 'America/Toronto')::date`,
    )
    .groupBy(aggregatedDate)
    .orderBy(asc(aggregatedDate));

  return data;
};

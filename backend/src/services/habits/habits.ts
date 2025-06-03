import { isValid, parse } from "date-fns";
import { asc, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { anonymize } from "../../helpers/anonymize";
import { habitsTable, type Habit, type HabitColumns } from "../../models/Habit";
import type { HabitKeys } from "../importers/obsidian/personal";
import { habitLabel, habitTransformers } from "./personal";
import type { ChartServiceReturn, HabitChartServiceParams } from "../charts/types";
import { getKeys } from "../../helpers/getKeys";
import { getAggregatedXColumn, getAggregatedYColumn, getMinMaxChart } from "../charts/charts";

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
  const xCol = getAggregatedXColumn(habitsTable[xKeyTyped], aggregation);
  const dateCol = getAggregatedXColumn(habitsTable.date, aggregation);

  const data = db
    .select({
      key: habitsTable.key,
      value: getAggregatedYColumn(sql`${habitsTable.value}::integer`, aggregation).mapWith(Number),
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

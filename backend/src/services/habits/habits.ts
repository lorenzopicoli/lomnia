import { isValid, parse } from "date-fns";
import { asc, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../../db/connection";
import { type Habit, habitsTable } from "../../models/Habit";
import { ChartPeriodInput } from "../../types/chartTypes";
import { anonymize } from "../anonymize";
import { getAggregatedXColumn } from "../common/getAggregatedXColumn";
import { getAggregatedYColumn } from "../common/getAggregatedYColumn";
import { habitLabel, habitTransformers } from "./personal";

export const HabitChartPeriodInput = z.object({
  ...ChartPeriodInput.shape,
  habitKey: z.string(),
});
export type HabitChartPeriodInput = z.infer<typeof HabitChartPeriodInput>;

export namespace HabitsService {
  const formatHabitResponse = (habits: Habit[], shouldAnonymize: boolean): (Habit & { label: string })[] => {
    return habits
      .filter((h) => !!h.value)
      .map((h) => {
        const key = h.key;
        const transformer = (habitTransformers as any)[key];
        const value = transformer ? transformer(h.value) : h.value;
        const label = (habitLabel as any)[h.key];

        return {
          ...h,
          key: shouldAnonymize ? anonymize(key) : key,
          value: shouldAnonymize ? anonymize(value) : value,
          label: shouldAnonymize ? anonymize(label) : label,
        };
      });
  };

  export async function byDay(params: { day: string; privateMode: boolean }) {
    const { day, privateMode } = params;
    if (!isValid(parse(day, "yyyy-MM-dd", new Date()))) {
      throw new Error("Invalid day");
    }
    const entries = await db.query.habitsTable.findMany({
      where: sql`date::date = ${day}`,
    });

    return formatHabitResponse(entries, privateMode);
  }

  export const getNumericHabitKeys = async () => {
    return db
      .select({
        key: habitsTable.key,
      })
      .from(habitsTable)
      .where(sql`${habitsTable.key} IS NOT NULL AND jsonb_typeof(value) = 'number'`)
      .groupBy(habitsTable.key)
      .then((keys) =>
        keys.map((k) => ({
          key: k.key,
          label: k.key,
          description: k.key,
        })),
      );
  };
}

export namespace HabitsChartService {
  export const numeric = async (params: HabitChartPeriodInput) => {
    const { habitKey, start, end, aggregationPeriod } = params;
    const supportedKeys = await HabitsService.getNumericHabitKeys();

    if (!supportedKeys.find((k) => k.key === params.habitKey)) {
      return [];
    }

    const aggregatedDate = getAggregatedXColumn(habitsTable.date, aggregationPeriod);
    const data = db
      .select({
        value: getAggregatedYColumn(sql`${habitsTable.value}::integer`, "sum").mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(habitsTable)
      .where(
        sql`
      ${habitsTable.key} = ${habitKey} AND
      ${habitsTable.date} >= (${start.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${habitsTable.date} <= (${end.toISO()} AT TIME ZONE 'America/Toronto')::date`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };
}

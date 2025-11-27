import { isValid, parse } from "date-fns";
import { asc, count, countDistinct, eq, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import z from "zod";
import { db } from "../../db/connection";
import { type Habit, habitsTable } from "../../models/Habit";
import { extractedHabitFeaturesTable, habitFeaturesTable } from "../../models/HabitFeature";
import { ChartPeriodInput } from "../../types/chartTypes";
import { anonymize } from "../anonymize";
import { getAggregatedXColumn } from "../common/getAggregatedXColumn";
import { getAggregatedYColumn } from "../common/getAggregatedYColumn";

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
        const value = h.value;
        const label = h.key;

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
      where: sql`(date at time zone ${habitsTable.timezone})::date = ${day}`,
    });

    return formatHabitResponse(entries, privateMode);
  }

  /**
   * Converts a Habit row into a time range [start, end]
   */
  export function habitToRange(habit: Habit): {
    start: DateTime;
    end: DateTime;
  } {
    const tz = habit.timezone;

    if (habit.recordedAt && !habit.periodOfDay && !habit.isFullDay) {
      const dt = DateTime.fromJSDate(habit.recordedAt, { zone: tz });
      return {
        start: dt,
        end: dt,
      };
    }

    const date = DateTime.fromJSDate(habit.date, { zone: tz });

    if (habit.isFullDay) {
      const start = date.startOf("day");
      const end = start.endOf("day");
      return { start, end };
    }

    if (habit.periodOfDay) {
      const { start, end } = getPeriodRange(date, habit.periodOfDay);
      return { start, end };
    }

    throw new Error("Failed to get habit range");
  }

  /**
   * Converts a Luxon DateTime (day) + periodOfDay into a start/end range.
   */
  function getPeriodRange(date: DateTime, period: Habit["periodOfDay"]) {
    switch (period) {
      case "morning":
        return {
          start: date.set({ hour: 6, minute: 0, second: 0 }),
          end: date.set({ hour: 11, minute: 59, second: 59 }),
        };

      case "afternoon":
        return {
          start: date.set({ hour: 12, minute: 0, second: 0 }),
          end: date.set({ hour: 17, minute: 59, second: 59 }),
        };

      case "evening":
        return {
          start: date.set({ hour: 18, minute: 0, second: 0 }),
          end: date.set({ hour: 23, minute: 59, second: 59 }),
        };

      case "over_night":
        return {
          start: date.set({ hour: 0, minute: 0, second: 0 }),
          end: date.plus({ days: 1 }).set({ hour: 5, minute: 59, second: 59 }),
        };

      default:
        throw new Error(`Unknown periodOfDay: ${period}`);
    }
  }

  export const getNumericHabitKeys = async () => {
    return db
      .select({
        key: habitFeaturesTable.name,
      })
      .from(habitFeaturesTable)
      .leftJoin(extractedHabitFeaturesTable, eq(extractedHabitFeaturesTable.habitFeatureId, habitFeaturesTable.id))
      .where(sql`jsonb_typeof(${extractedHabitFeaturesTable.value}) = 'number'`)
      .groupBy(habitFeaturesTable.name)
      .then((keys) =>
        keys.map((k) => ({
          key: k.key,
          label: k.key,
          description: k.key,
        })),
      );
  };

  export async function getCount() {
    return db
      .select({
        count: count(),
      })
      .from(habitsTable)
      .then((r) => r[0].count);
  }
  export async function uniqueHabitsCount() {
    return db
      .select({
        count: countDistinct(habitsTable.key),
      })
      .from(habitsTable)
      .then((r) => r[0].count);
  }
}

export namespace HabitsChartService {
  export const numeric = async (params: HabitChartPeriodInput) => {
    const { habitKey, start, end, aggregationPeriod } = params;
    const supportedKeys = await HabitsService.getNumericHabitKeys();

    if (!supportedKeys.find((k) => k.key === params.habitKey)) {
      return [];
    }

    const aggregatedDate = getAggregatedXColumn(extractedHabitFeaturesTable.startDate, aggregationPeriod);
    const data = db
      .select({
        value: getAggregatedYColumn(sql`${extractedHabitFeaturesTable.value}::integer`, "sum").mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(extractedHabitFeaturesTable)
      .innerJoin(habitFeaturesTable, eq(extractedHabitFeaturesTable.habitFeatureId, habitFeaturesTable.id))
      .where(
        sql`
      ${habitFeaturesTable.name} = ${habitKey} AND
      ${extractedHabitFeaturesTable.startDate} >= ${start.toISO()}  
      AND ${extractedHabitFeaturesTable.endDate} <= ${end.toISO()}`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };
}

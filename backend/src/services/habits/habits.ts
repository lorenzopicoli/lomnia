import { count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import { type Habit, habitsTable } from "../../models/Habit";
import {
  extractedHabitFeaturesTable,
  habitFeaturesTable,
  type ValidatedNewHabitFeature,
} from "../../models/HabitFeature";
import type { DateRange } from "../../types/chartTypes";
import { anonymize } from "../anonymize";

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

  export async function featureById(id: number) {
    return db
      .select()
      .from(habitFeaturesTable)
      .where(eq(habitFeaturesTable.id, id))
      .then((r) => r[0]);
  }

  export async function list(params: DateRange & { privateMode: boolean }) {
    const { start, end, privateMode } = params;
    const entries = await db.query.habitsTable.findMany({
      where: sql`
        ${habitsTable.recordedAt} >= ${start.toISO()} AND
        ${habitsTable.recordedAt} <= ${end.toISO()}
      `,
    });

    return formatHabitResponse(entries, privateMode);
  }

  export async function getRawHabits(params: { limit: number; page: number; search?: string }) {
    const { limit, page, search } = params;
    const searchQuery = `%${search}%`;

    const whereClause = !search
      ? sql`1=1`
      : sql`
      ${habitsTable.key} ILIKE ${searchQuery}
      OR ${habitsTable.periodOfDay} ILIKE ${searchQuery}
      OR ${habitsTable.source} ILIKE ${searchQuery}
      OR ${habitsTable.value}::text ILIKE ${searchQuery}
    `;

    const [entries, [{ count }]] = await Promise.all([
      db.query.habitsTable.findMany({
        extras: {
          recordedAt: sql`${habitsTable.recordedAt} at time zone ${habitsTable.timezone}`.as("recordedAt"),
          date: sql`${habitsTable.date} at time zone ${habitsTable.timezone}`.as("date"),
        },
        where: whereClause,
        offset: (page - 1) * limit,
        limit,
        orderBy: desc(habitsTable.recordedAt),
      }),

      db.select({ count: sql<number>`COUNT(*)` }).from(habitsTable).where(whereClause),
    ]);

    return {
      entries,
      total: Number(count),
      page,
      limit,
    };
  }

  export async function getFeatures(params: { limit: number; page: number; search?: string }) {
    const { limit, page, search } = params;
    const searchQuery = `%${search}%`;

    const whereClause = !search
      ? sql`1=1`
      : sql`
      ${habitFeaturesTable.name} ILIKE ${searchQuery}
    `;

    const baseQuery = db
      .select({
        id: habitFeaturesTable.id,
        name: habitFeaturesTable.name,
        createdAt: habitFeaturesTable.createdAt,
        matchedHabitEntries: countDistinct(extractedHabitFeaturesTable.habitId).as("matchedHabitEntries"),
      })
      .from(habitFeaturesTable)
      .leftJoin(extractedHabitFeaturesTable, eq(extractedHabitFeaturesTable.habitFeatureId, habitFeaturesTable.id))
      .where(whereClause)
      .groupBy(habitFeaturesTable.id)
      .$dynamic();

    const [entries, [{ count }]] = await Promise.all([
      baseQuery
        .orderBy(desc(habitFeaturesTable.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),

      db.select({ count: sql<number>`COUNT(*)` }).from(habitFeaturesTable).where(whereClause),
    ]);

    return {
      entries,
      total: Number(count),
      page,
      limit,
    };
  }

  export async function createFeature(feature: ValidatedNewHabitFeature) {
    await db.insert(habitFeaturesTable).values({ ...feature, createdAt: new Date() });
  }
  export async function updateFeature(id: number, feature: ValidatedNewHabitFeature) {
    await db
      .update(habitFeaturesTable)
      .set({ ...feature, updatedAt: new Date() })
      .where(eq(habitFeaturesTable.id, id));
  }

  export async function deleteFeature(id: number) {
    await db.transaction(async (tx) => {
      await tx.delete(extractedHabitFeaturesTable).where(eq(extractedHabitFeaturesTable.habitFeatureId, id));
      await tx.delete(habitFeaturesTable).where(eq(habitFeaturesTable.id, id));
    });
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

  export function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "number") {
      return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.00$/, "");
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      if (value.length === 0) return "None";
      if (value.length === 1) return value[0];

      return `${value.slice(0, -1).join(", ")} and ${value[value.length - 1]}`;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

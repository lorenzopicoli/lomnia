import { and, asc, countDistinct, desc, eq, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import { db } from "../../db/connection";
import {
  extractedHabitFeaturesTable,
  habitFeaturesTable,
  type ValidatedNewHabitFeature,
} from "../../models/HabitFeature";
import { ChartAggregationInput } from "../../types/chartTypes";
import { getAggregatedXColumn } from "../common/getAggregatedXColumn";
import { getAggregatedYColumn } from "../common/getAggregatedYColumn";

export const HabitFeatureChartPeriodInput = z.object({
  ...ChartAggregationInput.shape,
  habitKey: z.string(),
});
export type HabitFeatureChartPeriodInput = z.infer<typeof HabitFeatureChartPeriodInput>;
export namespace HabitFeaturesService {
  export async function byId(id: number) {
    return db
      .select()
      .from(habitFeaturesTable)
      .where(eq(habitFeaturesTable.id, id))
      .then((r) => r[0]);
  }

  export async function getTableData(params: { limit: number; page: number; search?: string }) {
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

  export async function create(feature: ValidatedNewHabitFeature) {
    await db.insert(habitFeaturesTable).values({ ...feature, createdAt: new Date() });
  }

  export async function update(id: number, feature: ValidatedNewHabitFeature) {
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

  export const getNumericKeys = async () => {
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

  export const getTextKeys = async () => {
    return db
      .select({
        key: habitFeaturesTable.name,
      })
      .from(habitFeaturesTable)
      .leftJoin(extractedHabitFeaturesTable, eq(extractedHabitFeaturesTable.habitFeatureId, habitFeaturesTable.id))
      .where(sql`jsonb_typeof(${extractedHabitFeaturesTable.value}) = 'string'`)
      .groupBy(habitFeaturesTable.name)
      .then((keys) =>
        keys.map((k) => ({
          key: k.key,
          label: k.key,
          description: k.key,
        })),
      );
  };
}

export namespace HabitFeaturesChartService {
  export const numeric = async (params: HabitFeatureChartPeriodInput) => {
    const { habitKey, start, end, aggregation } = params;
    const supportedKeys = await HabitFeaturesService.getNumericKeys();

    if (!supportedKeys.find((k) => k.key === params.habitKey)) {
      return [];
    }

    const aggregatedDate = getAggregatedXColumn(extractedHabitFeaturesTable.startDate, aggregation.period);
    const data = db
      .select({
        value: getAggregatedYColumn(sql`${extractedHabitFeaturesTable.value}::integer`, aggregation.function).mapWith(
          Number,
        ),
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

  export const coocurrences = async (params: HabitFeatureChartPeriodInput) => {
    const { habitKey, start, end } = params;
    const supportedKeys = await HabitFeaturesService.getTextKeys();

    if (!supportedKeys.find((k) => k.key === params.habitKey)) {
      return [];
    }

    const a = alias(extractedHabitFeaturesTable, "a");
    const b = alias(extractedHabitFeaturesTable, "b");
    const data = await db
      .select({
        source: sql`LEAST(${a.value}, ${b.value})`,
        target: sql`GREATEST(${a.value}, ${b.value})`,
        value: sql<number>`COUNT(*)`,
      })
      .from(a)
      .innerJoin(b, and(eq(a.habitId, b.habitId), lt(a.value, b.value)))
      .innerJoin(habitFeaturesTable, eq(a.habitFeatureId, habitFeaturesTable.id))
      .where(sql`
      ${habitFeaturesTable.name} = ${habitKey} AND
      ${a.startDate} >= ${start.toISO()}  
      AND ${a.endDate} <= ${end.toISO()}
    `)
      .groupBy(sql`LEAST(${a.value}, ${b.value})`, sql`GREATEST(${a.value}, ${b.value})`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(20);

    return data;
  };
}

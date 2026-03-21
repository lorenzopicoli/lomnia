import { and, asc, avg, count, desc, eq, gt, gte, isNotNull, sql } from "drizzle-orm";
import z from "zod";
import config from "../config";
import { db } from "../db/connection";
import { hourlyWeatherTable } from "../models";
import { exercisesTable, exerciseTypeOptions } from "../models/Exercise";
import { exerciseLapsTable } from "../models/ExerciseLap";
import { exerciseMetricsTable } from "../models/ExerciseMetrics";
import { ChartAggregationInput, DateRange } from "../types/chartTypes";
import { getAggregatedXColumn } from "./common/getAggregatedXColumn";
import { getAggregatedYColumn } from "./common/getAggregatedYColumn";

export const ExerciseChartPeriodInput = z.object({
  ...ChartAggregationInput.shape,
  exerciseKey: z.string().optional().nullable(),
});
export type ExerciseChartPeriodInput = z.infer<typeof ExerciseChartPeriodInput>;
export const ExerciseChartDateRangeInput = z.object({
  ...DateRange.shape,
  exerciseKey: z.string().optional().nullable(),
});
export type ExerciseChartDateRangeInput = z.infer<typeof ExerciseChartDateRangeInput>;

export namespace ExerciseService {
  export const getByDay = async (params: { day: string }) => {
    // Have to group the results in JS because drizzle's schema query seems to break the stages date for some reason
    const { day } = params;
    const exercises = await db
      .select()
      .from(exercisesTable)
      .where(eq(sql`DATE(${exercisesTable.startedAt} AT TIME ZONE COALESCE(${exercisesTable.timezone}, 'UTC'))`, day));

    return exercises;
  };

  export const getById = async (id: number, includeAdvancedDetails?: boolean) => {
    const exercise = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, id))
      .limit(1)
      .then((e) => e[0]);
    if (includeAdvancedDetails) {
      const laps = await db.select().from(exerciseLapsTable).where(eq(exerciseLapsTable.exerciseId, id));
      const metrics = await db.select().from(exerciseMetricsTable).where(eq(exerciseMetricsTable.exerciseId, id));

      return { exercise, laps, metrics };
    }

    return { exercise, laps: null, metrics: null };
  };

  export const getKeys = () => {
    return exerciseTypeOptions;
  };

  const exerciseChartFilters = ({ exerciseKey, start, end }: ExerciseChartDateRangeInput) => {
    return sql`
    ${exerciseKey ? sql`${exercisesTable.exerciseType} = ${exerciseKey}` : sql`1=1`}
    AND ${exercisesTable.startedAt} >= ${start.toISO()}
    AND ${exercisesTable.endedAt} <= ${end.toISO()}
  `;
  };

  export const getDailyFrequency = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;

    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const data = db
      .select({
        frequency: count(),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(exerciseChartFilters(params))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const averagePacePerTemperature = async (params: ExerciseChartDateRangeInput) => {
    const data = db
      .select({
        temp: sql`ROUND(${hourlyWeatherTable.apparentTemperature})`.mapWith(Number),
        pace: avg(exercisesTable.avgPace),
        count: count(),
      })
      .from(exercisesTable)
      .innerJoin(hourlyWeatherTable, eq(hourlyWeatherTable.date, sql`date_trunc('hour', ${exercisesTable.startedAt})`))
      .where(and(exerciseChartFilters(params), gt(exercisesTable.avgPace, 0)))
      .groupBy(sql`ROUND(${hourlyWeatherTable.apparentTemperature})`)
      .orderBy(sql`ROUND(${hourlyWeatherTable.apparentTemperature})`);

    return data;
  };

  export const durations = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;
    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const duration = sql`
    EXTRACT(EPOCH FROM (${exercisesTable.endedAt} - ${exercisesTable.startedAt}))
  `;
    const aggregatedDuration = getAggregatedYColumn(duration, aggregation.function);

    const data = db
      .select({
        value: aggregatedDuration.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(exerciseChartFilters(params))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const distances = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;
    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const aggregatedDistance = getAggregatedYColumn(exercisesTable.distance, aggregation.function);

    const data = await db
      .select({
        value: aggregatedDistance.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(and(exerciseChartFilters(params), isNotNull(exercisesTable.distance)))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const fastestLaps = async (params: ExerciseChartDateRangeInput) => {
    const data = db
      .select({
        name: exercisesTable.name,
        date: exercisesTable.startedAt,
        pace: exerciseLapsTable.avgPace,
      })
      .from(exerciseLapsTable)
      .innerJoin(exercisesTable, eq(exerciseLapsTable.exerciseId, exercisesTable.id))
      .where(
        and(exerciseChartFilters(params), isNotNull(exerciseLapsTable.avgPace), gte(exerciseLapsTable.distance, 1000)),
      )
      .orderBy(asc(exerciseLapsTable.avgPace))
      .limit(config.charts.exerciseFastestLapsBar.limit);

    return data;
  };

  export async function getTableData(params: { limit: number; page: number; search?: string }) {
    const { limit, page, search } = params;
    const searchQuery = `%${search}%`;

    const whereClause = !search ? sql`1=1` : sql`${exercisesTable.name} ILIKE ${searchQuery}`;

    const baseQuery = db
      .select({
        id: exercisesTable.id,
        name: exercisesTable.name,
        type: exercisesTable.exerciseType,
        source: exercisesTable.source,
        startedAt: exercisesTable.startedAt,
        endedAt: exercisesTable.endedAt,
        distance: exercisesTable.distance,
        avgPace: exercisesTable.avgPace,
        createdAt: exercisesTable.createdAt,
        timezone: exercisesTable.timezone,
      })
      .from(exercisesTable)
      .where(whereClause)
      .$dynamic();

    const [entries, [{ count }]] = await Promise.all([
      baseQuery
        .orderBy(desc(exercisesTable.startedAt))
        .limit(limit)
        .offset((page - 1) * limit),

      db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(exercisesTable)
        .where(whereClause),
    ]);

    return {
      entries,
      total: Number(count),
      page,
      limit,
    };
  }
}

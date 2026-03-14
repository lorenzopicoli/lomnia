import { and, asc, avg, count, eq, gt, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../db/connection";
import { exercisesTable, exerciseTypeOptions } from "../models/Exercise";
import { exerciseLapsTable } from "../models/ExerciseLap";
import { ChartAggregationInput } from "../types/chartTypes";
import { getAggregatedXColumn } from "./common/getAggregatedXColumn";

export const ExerciseChartPeriodInput = z.object({
  ...ChartAggregationInput.shape,
  exerciseKey: z.string().optional().nullable(),
});
export type ExerciseChartPeriodInput = z.infer<typeof ExerciseChartPeriodInput>;

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

  export const getById = async (id: number) => {
    const exercise = await db.select().from(exercisesTable).where(eq(exercisesTable.id, id)).limit(1);

    return exercise[0];
  };

  export const getKeys = () => {
    return exerciseTypeOptions;
  };

  const exerciseChartFilters = ({ exerciseKey, start, end }: ExerciseChartPeriodInput) => {
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

  export const averagePacePerTemperature = async (params: ExerciseChartPeriodInput) => {
    const data = db
      .select({
        temp: sql`ROUND(hourlyWeatherTable.apparentTemperature)`.mapWith(Number),
        pace: avg(exercisesTable.avgPace),
        count: count(),
      })
      .from(exercisesTable)
      .innerJoin(exerciseLapsTable, eq(exerciseLapsTable.exerciseId, exercisesTable.id))
      .where(and(exerciseChartFilters(params), gt(exercisesTable.avgPace, 0)))
      .groupBy(sql`ROUND(hourlyWeatherTable.apparentTemperature)`)
      .orderBy(sql`ROUND(hourlyWeatherTable.apparentTemperature)`);

    return data;
  };

  export const longestDurations = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;

    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const data = db
      .select({
        value: sql`MAX(EXTRACT(EPOCH FROM (${exercisesTable.endedAt} - ${exercisesTable.startedAt})))`.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(exerciseChartFilters(params))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const longestDistances = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;

    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const data = db
      .select({
        value: sql`MAX(${exercisesTable.distance})`.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(exerciseChartFilters(params))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const highestAverageHeartRate = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;

    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const data = db
      .select({
        value: sql`MAX(${exercisesTable.avgHeartRate})`.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(exerciseChartFilters(params))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const fastestLaps = async (params: ExerciseChartPeriodInput) => {
    const { aggregation } = params;

    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const data = db
      .select({
        value: sql`MAX(${exerciseLapsTable.avgPace})`.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .innerJoin(exerciseLapsTable, eq(exerciseLapsTable.exerciseId, exercisesTable.id))
      .where(exerciseChartFilters(params))
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };
}

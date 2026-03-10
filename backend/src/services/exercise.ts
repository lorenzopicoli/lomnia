import { asc, count, eq, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../db/connection";
import { exercisesTable, exerciseTypeOptions } from "../models/Exercise";
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

  export const getDailyFrequency = async (params: ExerciseChartPeriodInput) => {
    const { exerciseKey, start, end, aggregation } = params;

    const aggregatedDate = getAggregatedXColumn(exercisesTable.startedAt, aggregation.period);
    const data = db
      .select({
        frequency: count(),
        date: aggregatedDate.mapWith(String),
      })
      .from(exercisesTable)
      .where(
        sql`
        ${exerciseKey ? sql`${exercisesTable.exerciseType} = ${exerciseKey}` : sql`1=1`} AND
      ${exercisesTable.startedAt} >= ${start.toISO()}
      AND ${exercisesTable.endedAt} <= ${end.toISO()}`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };
}

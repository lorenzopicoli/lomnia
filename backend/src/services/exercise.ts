import { eq, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { exercisesTable } from "../models/Exercise";

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
}

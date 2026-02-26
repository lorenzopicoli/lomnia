import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { sleepStagesTable } from "../models";
import { sleepsTable } from "../models/Sleep";

export namespace SleepService {
  export const getDay = async (params: { day: string }) => {
    // Have to group the results in JS because drizzle's schema query seems to break the stages date for some reason
    const { day } = params;
    const sleeps = await db
      .select()
      .from(sleepsTable)
      .where(eq(sql`DATE(${sleepsTable.startedAt} AT TIME ZONE COALESCE(${sleepsTable.timezone}, 'UTC'))`, day));

    if (sleeps.length === 0) {
      return [];
    }

    const sleepExternalIds = sleeps.map((s) => s.externalId).filter((id): id is string => !!id);

    const stages = await db
      .select()
      .from(sleepStagesTable)
      .where(inArray(sleepStagesTable.sleepId, sleepExternalIds))
      .orderBy(sleepStagesTable.startedAt);

    const stagesBySleep = new Map<string, typeof stages>();

    for (const stage of stages) {
      const key = stage.sleepId;
      if (!stagesBySleep.has(key)) {
        stagesBySleep.set(key, []);
      }
      stagesBySleep.get(key)?.push(stage);
    }

    return sleeps.map((sleep) => ({
      sleep,
      sleepStages: stagesBySleep.get(sleep.externalId ?? "") ?? [],
    }));
  };
}

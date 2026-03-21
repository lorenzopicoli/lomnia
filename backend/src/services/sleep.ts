import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { sleepStagesTable } from "../models";
import { sleepsTable } from "../models/Sleep";
import type { ChartPeriodInput } from "../types/chartTypes";

export namespace SleepService {
  export const getDay = async (params: { day: string }) => {
    // Have to group the results in JS because drizzle's schema query seems to break the stages date for some reason
    const { day } = params;
    const sleeps = await db.select().from(sleepsTable).where(sql`${sleepsTable.sleepDate} = ${day}`);

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

  export const startEndAndDuration = async (params: ChartPeriodInput) => {
    const sleeps = await db
      .select({
        date: sleepsTable.startedAt,
        duration: sql<number>`
      ABS(EXTRACT(EPOCH FROM (${sleepsTable.endedAt} - ${sleepsTable.startedAt}))
      / 3600)
    `
          .mapWith(Number)
          .as("duration"),

        startHour: sql<number>`
      EXTRACT(HOUR FROM ${sleepsTable.startedAt} AT TIME ZONE ${sleepsTable.timezone})
      + EXTRACT(MINUTE FROM ${sleepsTable.startedAt} AT TIME ZONE ${sleepsTable.timezone}) / 60.0
    `
          .mapWith(Number)
          .as("start_hour"),

        endHour: sql<number>`
      EXTRACT(HOUR FROM ${sleepsTable.endedAt} AT TIME ZONE ${sleepsTable.timezone})
      + EXTRACT(MINUTE FROM ${sleepsTable.endedAt} AT TIME ZONE ${sleepsTable.timezone}) / 60.0
    `
          .mapWith(Number)
          .as("end_hour"),
      })
      .from(sleepsTable)
      .where(
        sql`${sleepsTable.startedAt} >= ${params.start.toISO()} AND ${sleepsTable.endedAt} <= ${params.end.toISO()}`,
      )
      .orderBy(asc(sleepsTable.startedAt));

    if (sleeps.length === 0) {
      return [];
    }

    return sleeps;
  };

  export async function getTableData(params: { limit: number; page: number; search?: string }) {
    const { limit, page, search } = params;
    const searchQuery = `%${search}%`;

    const whereClause = !search ? sql`1=1` : sql`${sleepsTable.comment} ILIKE ${searchQuery}`;

    const baseQuery = db.select().from(sleepsTable).where(whereClause).$dynamic();

    const [entries, [{ count }]] = await Promise.all([
      baseQuery
        .orderBy(desc(sleepsTable.startedAt))
        .limit(limit)
        .offset((page - 1) * limit),

      db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(sleepsTable)
        .where(whereClause),
    ]);

    return {
      entries,
      total: Number(count),
      page,
      limit,
    };
  }

  export const getById = async (id: number) => {
    const sleep = await db
      .select()
      .from(sleepsTable)
      .where(eq(sleepsTable.id, id))
      .limit(1)
      .then((e) => e[0]);
    const stages = await db
      .select()
      .from(sleepStagesTable)
      .where(eq(sleepStagesTable.sleepId, sleep.externalId ?? ""));

    return { sleep, stages };
  };
}

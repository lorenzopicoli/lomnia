import { db } from "../db/connection";

export namespace SleepService {
  export const getDay = async (params: { day: string }) => {
    const { day } = params;
    return db.query.sleepsTable
      .findMany({
        where: (sleeps, { eq, sql }) =>
          eq(sql`DATE(${sleeps.startedAt} AT TIME ZONE COALESCE(${sleeps.timezone}, 'UTC'))`, day),
        with: {
          stages: true,
        },
      })
      .then((result) =>
        result.map((r) => ({
          sleep: r,
          sleepStages: r.stages,
        })),
      );
  };
}

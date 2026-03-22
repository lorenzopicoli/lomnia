import { TZDate } from "@date-fns/tz";

export type SleepStageType = "awake" | "light" | "deep" | "rem" | "unmeasurable";

export function getSleepStagesTotals(
  stages: { stage: SleepStageType; startedAt: string; endedAt: string }[],
  timezone: string,
) {
  return stages.reduce<Record<SleepStageType, number>>(
    (acc, stage) => {
      const s = new TZDate(stage.startedAt, timezone);
      const e = new TZDate(stage.endedAt, timezone);
      const diff = e.getTime() - s.getTime();

      acc[stage.stage] = (acc[stage.stage] ?? 0) + diff;
      return acc;
    },
    {
      awake: 0,
      light: 0,
      deep: 0,
      rem: 0,
      unmeasurable: 0,
    },
  );
}

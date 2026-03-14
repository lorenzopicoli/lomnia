import z from "zod";
import { ExerciseChartPeriodInput, ExerciseService } from "../services/exercise";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const exerciseRouter = t.router({
  getByDay: loggedProcedure
    .input(
      z.object({
        day: z.iso.date(),
      }),
    )
    .query((opts) => {
      return ExerciseService.getByDay(opts.input) ?? [];
    }),
  getById: loggedProcedure.input(z.object({ id: z.number() })).query((opts) => {
    return ExerciseService.getById(opts.input.id) ?? [];
  }),
  getKeys: loggedProcedure.query(() => {
    return ExerciseService.getKeys();
  }),
});

export const exerciseChartRouter = t.router({
  frequency: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.getDailyFrequency(opts.input);
  }),
  averagePacePerTemperature: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.averagePacePerTemperature(opts.input);
  }),
  longestDurations: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.longestDurations(opts.input);
  }),
  longestDistances: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.longestDistances(opts.input);
  }),
  highestAverageHeartRate: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.highestAverageHeartRate(opts.input);
  }),
  fastestLaps: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.fastestLaps(opts.input);
  }),
});

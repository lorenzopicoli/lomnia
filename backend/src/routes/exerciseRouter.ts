import z from "zod";
import { ExerciseChartDateRangeInput, ExerciseChartPeriodInput, ExerciseService } from "../services/exercise";
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
  averagePacePerTemperature: loggedProcedure.input(ExerciseChartDateRangeInput).query((opts) => {
    return ExerciseService.averagePacePerTemperature(opts.input);
  }),
  durations: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.durations(opts.input);
  }),
  distances: loggedProcedure.input(ExerciseChartPeriodInput).query((opts) => {
    return ExerciseService.distances(opts.input);
  }),
  fastestLaps: loggedProcedure.input(ExerciseChartDateRangeInput).query((opts) => {
    return ExerciseService.fastestLaps(opts.input);
  }),
});

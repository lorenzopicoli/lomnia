import z from "zod";
import { HabitChartPeriodInput, HabitsChartService, HabitsService } from "../services/habits/habits";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const habitsRouter = t.router({
  getByDay: loggedProcedure
    .input(
      z.object({
        day: z.string().date(),
        privateMode: z.boolean(),
      }),
    )
    .query((opts) => {
      return HabitsService.byDay(opts.input) ?? [];
    }),

  getRawHabitsTable: loggedProcedure
    .input(
      z.object({
        page: z.number().min(0),
        limit: z.number().min(1),
      }),
    )
    .query((opts) => {
      return HabitsService.getRawHabits(opts.input) ?? [];
    }),

  getKeys: loggedProcedure.query(async () => {
    return {
      numeric: await HabitsService.getNumericHabitKeys(),
    };
  }),
});

export const habitsChartRouter = t.router({
  numeric: loggedProcedure.input(HabitChartPeriodInput).query((opts) => {
    return HabitsChartService.numeric(opts.input);
  }),
});

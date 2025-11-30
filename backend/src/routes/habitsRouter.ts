import z from "zod";
import { db } from "../db/connection";
import { habitFeatureRuleSchema, habitsTable } from "../models";
import { HabitFeatureEvaluation } from "../services/habits/HabitFeatureEvaluation";
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
        search: z.string().optional(),
        limit: z.number().min(1),
      }),
    )
    .query((opts) => {
      return HabitsService.getRawHabits(opts.input) ?? [];
    }),

  getFeaturesTable: loggedProcedure
    .input(
      z.object({
        page: z.number().min(0),
        search: z.string().optional(),
        limit: z.number().min(1),
      }),
    )
    .query((opts) => {
      return HabitsService.getFeatures(opts.input) ?? [];
    }),

  previewFeaturesExtraction: loggedProcedure.input(z.array(habitFeatureRuleSchema)).query(async (opts) => {
    const habits = await db.select().from(habitsTable).orderBy(habitsTable.date);
    const evaluation = new HabitFeatureEvaluation([{ id: -1, name: "name", rules: opts.input }]);
    const features = [];
    for (const habit of habits) {
      features.push(...evaluation.extractHabitFeatures(habit).flatMap((r) => ({ habit, feature: r })));
      if (features.length >= 100) {
        break;
      }
    }
    return features;
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

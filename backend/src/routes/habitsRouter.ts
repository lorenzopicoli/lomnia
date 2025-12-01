import z from "zod";
import { habitFeatureRuleSchema, habitFeatureSchema, validateNewHabitFeature } from "../models";
import { HabitFeatureExtraction } from "../services/habits/HabitFeatureExtraction";
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
    return HabitFeatureExtraction.preview(opts.input);
  }),

  saveHabitFeature: loggedProcedure.input(habitFeatureSchema).mutation(async (opts) => {
    console.log("In", opts.input);
    const feature = await validateNewHabitFeature(opts.input);
    await HabitsService.createFeature(feature);
    await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
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

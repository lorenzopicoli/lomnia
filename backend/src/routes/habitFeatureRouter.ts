import z from "zod";
import { habitFeatureRuleSchema, habitFeatureSchema, validateNewHabitFeature } from "../models";
import { HabitFeatureExtraction } from "../services/habits/HabitFeatureExtraction";
import { HabitChartPeriodInput, HabitsChartService, HabitsService } from "../services/habits/habits";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const habitFeaturesRouter = t.router({
  getTable: loggedProcedure
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

  save: loggedProcedure
    .input(
      z.object({
        ...habitFeatureSchema.shape,
        id: z.number().optional(),
      }),
    )
    .mutation(async (opts) => {
      const feature = await validateNewHabitFeature(opts.input);
      if (opts.input.id) {
        await HabitsService.updateFeature(opts.input.id, feature);
      } else {
        await HabitsService.createFeature(feature);
      }
      await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
    }),

  delete: loggedProcedure.input(z.number()).mutation(async (opts) => {
    await HabitsService.deleteFeature(opts.input);
    await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
  }),

  getById: loggedProcedure.input(z.number().min(0)).query((opts) => {
    return HabitsService.featureById(opts.input) ?? [];
  }),

  getKeys: loggedProcedure.query(async () => {
    return {
      numeric: await HabitsService.getNumericHabitKeys(),
    };
  }),
});

export const habitFeaturesChartRouter = t.router({
  numeric: loggedProcedure.input(HabitChartPeriodInput).query((opts) => {
    return HabitsChartService.numeric(opts.input);
  }),
});

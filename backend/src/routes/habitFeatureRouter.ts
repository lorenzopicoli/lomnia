import z from "zod";
import { habitFeatureRuleSchema, habitFeatureSchema, validateNewHabitFeature } from "../models";
import { HabitFeatureExtraction } from "../services/habits/HabitFeatureExtraction";
import {
  HabitFeatureChartPeriodInput,
  HabitFeatureChartPeriodNoAggInput,
  HabitFeaturesChartService,
  HabitFeaturesService,
} from "../services/habits/habitFeature";
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
      return HabitFeaturesService.getTableData(opts.input) ?? [];
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
        await HabitFeaturesService.update(opts.input.id, feature);
      } else {
        await HabitFeaturesService.create(feature);
      }
      await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
    }),

  delete: loggedProcedure.input(z.number()).mutation(async (opts) => {
    await HabitFeaturesService.deleteFeature(opts.input);
    await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
  }),

  getById: loggedProcedure.input(z.number().min(0)).query((opts) => {
    return HabitFeaturesService.byId(opts.input) ?? [];
  }),

  getKeys: loggedProcedure.query(async () => {
    return {
      numeric: await HabitFeaturesService.getNumericKeys(),
      text: await HabitFeaturesService.getTextKeys(),
    };
  }),
});

export const habitFeaturesChartRouter = t.router({
  numeric: loggedProcedure.input(HabitFeatureChartPeriodInput).query((opts) => {
    return HabitFeaturesChartService.numeric(opts.input);
  }),
  textGroup: loggedProcedure.input(HabitFeatureChartPeriodNoAggInput).query((opts) => {
    return HabitFeaturesChartService.textGroup(opts.input);
  }),
  cooccurrences: loggedProcedure.input(HabitFeatureChartPeriodInput).query((opts) => {
    return HabitFeaturesChartService.coocurrences(opts.input);
  }),
});

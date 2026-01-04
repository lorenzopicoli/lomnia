import z from "zod";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const pointOfInterestRouter = t.router({
  getCount: loggedProcedure.input(z.object({ day: z.iso.date() })).query((_opts) => {}),
  getTable: loggedProcedure
    .input(
      z.object({
        page: z.number().min(0),
        search: z.string().optional(),
        limit: z.number().min(1),
      }),
    )
    .query((_opts) => {}),
  save: loggedProcedure
    // .input(
    // z.object({
    //   ...habitFeatureSchema.shape,
    //   id: z.number().optional(),
    // }),
    // )
    .mutation(async (_opts) => {
      // const feature = await validateNewHabitFeature(opts.input);
      // if (opts.input.id) {
      //   await HabitFeaturesService.update(opts.input.id, feature);
      // } else {
      //   await HabitFeaturesService.create(feature);
      // }
      // await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
    }),

  delete: loggedProcedure.input(z.number()).mutation(async (_opts) => {
    // await HabitFeaturesService.deleteFeature(opts.input);
    // await HabitFeatureExtraction.extractAndSaveHabitsFeatures();
  }),

  getById: loggedProcedure.input(z.number().min(0)).query((_opts) => {
    // return HabitFeaturesService.byId(opts.input) ?? [];
  }),
  locationsCount: loggedProcedure
    // .input(
    // z.array(habitFeatureRuleSchema)
    // )
    .query(async (_opts) => {
      // return HabitFeatureExtraction.preview(opts.input);
    }),
});

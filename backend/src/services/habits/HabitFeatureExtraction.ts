import { chunk } from "lodash";
import { db } from "../../db/connection";
import { habitsTable } from "../../models";
import {
  extractedHabitFeaturesTable,
  habitFeaturesTable,
  insertExtractedHabitFeatureSchema,
  type ValidatedNewExtractedHabitFeature,
  validateHabitFeature,
} from "../../models/HabitFeature";
import { Logger } from "../Logger";
import { HabitFeatureEvaluation } from "./HabitFeatureEvaluation";
import { HabitsService } from "./habits";

export namespace HabitFeatureExtraction {
  const logger = new Logger("HabitFeatureExtraction");
  export async function extractAndSaveHabitsFeatures() {
    logger.info("Starting habits feature extraction");
    const habits = await db.select().from(habitsTable).orderBy(habitsTable.date);
    const habitFeatures = await db.select().from(habitFeaturesTable).orderBy(habitFeaturesTable.createdAt);

    const validated = habitFeatures.map(validateHabitFeature);
    const habitEvaluation = new HabitFeatureEvaluation(validated);
    const featuresToSave: ValidatedNewExtractedHabitFeature[] = [];
    await Promise.all(
      habits.map(async (habit) => {
        const extractionResult = habitEvaluation.extractHabitFeatures(habit);
        if (!extractionResult.length) {
          return;
        }
        const periodRange = HabitsService.habitToRange(habit);
        featuresToSave.push(
          ...extractionResult.map((value) =>
            insertExtractedHabitFeatureSchema.parse({
              ...value,
              timezone: habit.timezone,
              startDate: periodRange.start.toJSDate() ?? null,
              endDate: periodRange.end.toJSDate() ?? null,
              habitId: habit.id,
            }),
          ),
        );
      }),
    );
    await db.transaction(async (tx) => {
      await tx.delete(extractedHabitFeaturesTable);
      const insertChunks = chunk(featuresToSave, 50);
      for (const payload of insertChunks) {
        await tx.insert(extractedHabitFeaturesTable).values(payload);
      }
    });
    logger.info("Done habits feature extraction");
  }
}

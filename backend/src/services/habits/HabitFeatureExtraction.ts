import { chunk } from "lodash";
import { db } from "../../db/connection";
import type { DBTransaction } from "../../db/types";
import { habitsTable } from "../../models";
import {
  extractedHabitFeaturesTable,
  type HabitFeature,
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
  export async function extractAndSaveHabitsFeatures(tx?: DBTransaction) {
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
    if (tx) {
      await deleteAndInsert(tx, featuresToSave);
    } else {
      await db.transaction(async (tx) => {
        await deleteAndInsert(tx, featuresToSave);
      });
    }
    logger.info("Done habits feature extraction");
  }

  async function deleteAndInsert(tx: DBTransaction, featuresToSave: ValidatedNewExtractedHabitFeature[]) {
    await tx.delete(extractedHabitFeaturesTable);
    const insertChunks = chunk(featuresToSave, 50);
    for (const payload of insertChunks) {
      await tx.insert(extractedHabitFeaturesTable).values(payload);
    }
  }

  export async function preview(rules: HabitFeature["rules"]) {
    const habits = await db.select().from(habitsTable).orderBy(habitsTable.date);
    const evaluation = new HabitFeatureEvaluation([{ id: -1, name: "name", rules }]);
    const features = [];
    for (const habit of habits) {
      features.push(...evaluation.extractHabitFeatures(habit).flatMap((r) => ({ habit, feature: r })));
      if (features.length >= 100) {
        break;
      }
    }

    return features;
  }
}

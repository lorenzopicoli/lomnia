import "dotenv/config";
import { db } from "./db/connection";
import { habitsTable } from "./models";
import {
  extractedHabitFeaturesTable,
  habitFeaturesTable,
  insertExtractedHabitFeatureSchema,
  validateHabitFeature,
} from "./models/HabitFeature";
import { HabitFeatureEvaluation } from "./services/habits/HabitFeatureEvaluation";
import { HabitsService } from "./services/habits/habits";

const main = async () => {
  // const importer = new ImporterManager();
  // importer.schedule(10000);
  const habits = await db.select().from(habitsTable).orderBy(habitsTable.date);
  const habitFeatures = await db.select().from(habitFeaturesTable).orderBy(habitFeaturesTable.createdAt);
  console.log("a", habitFeatures);

  const validated = habitFeatures.map(validateHabitFeature);
  const habitEvaluation = new HabitFeatureEvaluation(validated);

  await Promise.all(
    habits.map(async (h) => {
      const a = habitEvaluation.extractHabitFeatures(h);
      const range = HabitsService.habitToRange(h);
      if (!range.start.toJSDate() || !range.end.toJSDate()) {
        console.log("R", range, h);
      }
      const bla = a.map((value) =>
        insertExtractedHabitFeatureSchema.parse({
          ...value,
          timezone: h.timezone,
          startDate: range.start.toJSDate() ?? null,
          endDate: range.end.toJSDate() ?? null,
          habitId: h.id,
        }),
      );
      if (!bla.length) {
        // console.log("Nothing");
        return;
      }
      await db.insert(extractedHabitFeaturesTable).values(bla);
      if (a.length > 0) {
        console.log("Habit", h);
        console.log("Features", a);
      }
    }),
  );

  // Keep the process running
  setInterval(() => {}, 1 << 30);
};

main();

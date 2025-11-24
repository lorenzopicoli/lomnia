import "dotenv/config";
import { db } from "./db/connection";
import { habitsTable } from "./models";
import { HabitEvaluationService } from "./services/habits/HabitRuleEvaluationService";

const main = async () => {
  // const importer = new ImporterManager();
  // importer.schedule(10000);
  const habits = await db.select().from(habitsTable).orderBy(habitsTable.date);
  for (const h of habits) {
    HabitEvaluationService.evaluateEntry(h);
  }
  // Keep the process running
  setInterval(() => {}, 1 << 30);
};

main();

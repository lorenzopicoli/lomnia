import type { getTableColumns } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";

export const periodOfDayEnum = pgEnum("period_of_day", ["morning", "afternoon", "evening", "over_night"]);

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  /**
   * It's expected to be of the type HabitsKey
   */
  key: text("key").notNull(),
  /**
   * Code that relies on this should support:
   * - dates
   * - booleans
   * - string
   * - numbers
   *
   * This should not have any JSON shape. For example:
   * value: 1 instead of value: { "value": 1 }
   */
  value: jsonb("value"),
  /**
   * Date of when this habit was recorded. In UTC
   */
  date: timestamp("date").notNull(),
  /**
   * The source where this habit was recorded, not necessarily how it was imported
   * ie. "obsidian" instead of "filesImporter"
   */
  source: text("source").notNull(),
  /**
   * Timezone of the user when this was recorded
   */
  timezone: text("timezone").notNull(),
  /**
   * Any additional comments made during record
   */
  comments: text("comments"),
  /**
   * Time at which the habit was recorded
   */
  recordedAt: timestamp("recorded_at"),
  /**
   * If defined, the habit happened during a certain part of the day and not at
   * the time of the date property
   */
  periodOfDay: periodOfDayEnum("period_of_day"),
  /**
   * If defined, the habit happened at some point in the day, or during the full day,
   * the time of the date property should be discarded
   */
  isFullDay: boolean("is_full_day"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;
export type HabitColumns = keyof ReturnType<typeof getTableColumns<typeof habitsTable>>;

import type { getTableColumns } from "drizzle-orm";
import { integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { exercisesTable } from "./Exercise";
import { externalDevicesTable } from "./ExternalDevice";
import { importJobsTable } from "./ImportJob";

export const exerciseLapsTable = pgTable("exercise_laps", {
  id: serial("id").primaryKey(),
  /**
   * Start time in UTC
   */
  startedAt: timestamp("started_at").notNull(),
  /**
   * End time in UTC
   */
  endedAt: timestamp("ended_at").notNull(),
  /**
   * Where the sleep record came from
   */
  source: text("source").notNull(),
  /**
   * Distance in meters
   */
  distance: real("distance"),
  /**
   * Duration in seconds
   */
  duration: integer("duration"),
  /**
   * Average pace in min/km
   */
  avgPace: real("avg_pace"),
  /**
   * Average heart rate in bpm
   */
  avgHeartRate: real("avg_heart_rate"),
  /**
   * The id of the sleep record for the external provider
   */
  externalId: text("external_id").notNull(),
  /**
   * Exercise this maps to
   */
  externalExerciseId: text("external_exercise_id")
    .references(() => exercisesTable.externalId)
    .notNull(),
  /**
   * Canonical device this maps to
   */
  externalDeviceId: text("external_device_id").references(() => externalDevicesTable.externalId),
  timezone: text("timezone"),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
export type ExerciseLap = typeof exerciseLapsTable.$inferSelect;
export type NewExerciseLap = typeof exerciseLapsTable.$inferInsert;
export type ExerciseLapColumns = keyof ReturnType<typeof getTableColumns<typeof exerciseLapsTable>>;

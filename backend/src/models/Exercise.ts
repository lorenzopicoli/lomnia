import type { getTableColumns } from "drizzle-orm";
import { integer, pgEnum, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { externalDevicesTable } from "./ExternalDevice";
import { importJobsTable } from "./ImportJob";

export const exerciseTypeEnumValues = [
  "running",
  "strength_training",
  "volleyball",
  "cycling",
  "yoga",
  "generic",
] as const;
export const exerciseTypeEnum = pgEnum("exercise_type", exerciseTypeEnumValues);

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  /**
   * The name given to the exercise
   */
  name: text("name").notNull(),
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
   * The type of exercise that was done
   */
  exerciseType: exerciseTypeEnum("exercise_type").notNull(),
  /**
   * Canonical device this status maps to
   */
  externalDeviceId: text("external_device_id").references(() => externalDevicesTable.externalId),
  timezone: text("timezone"),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
export type Exercise = typeof exercisesTable.$inferSelect;
export type NewExercise = typeof exercisesTable.$inferInsert;
export type ExerciseColumns = keyof ReturnType<typeof getTableColumns<typeof exercisesTable>>;

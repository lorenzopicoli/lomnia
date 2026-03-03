import type { getTableColumns } from "drizzle-orm";
import { integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { exercisesTable } from "./Exercise";
import { externalDevicesTable } from "./ExternalDevice";
import { importJobsTable } from "./ImportJob";

export const exerciseMetricsTable = pgTable("exercise_metrics", {
  id: serial("id").primaryKey(),
  /**
   * Record time in UTC
   */
  recordedAt: timestamp("recorded_at").notNull(),
  /**
   * Where the sleep record came from
   */
  source: text("source").notNull(),
  /**
   * Speed in m/s
   */
  speed: real("speed"),
  /**
   * Step length in cm
   */
  stepLength: real("step_length"),
  /**
   * Time spent tounching the ground in ms
   */
  stanceTime: real("stance_time"),
  /**
   * Pace in min/km
   */
  pace: real("pace"),
  /**
   * Cadence in steps per min
   */
  cadence: real("cadence"),
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
export type ExerciseMetrics = typeof exerciseMetricsTable.$inferSelect;
export type NewExerciseMetrics = typeof exerciseMetricsTable.$inferInsert;
export type ExerciseMetricColumns = keyof ReturnType<typeof getTableColumns<typeof exerciseMetricsTable>>;

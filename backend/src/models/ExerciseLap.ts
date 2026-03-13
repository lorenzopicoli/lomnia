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
   * Max pace in min/km
   */
  maxPace: real("max_pace"),
  /**
   * Max pace in min/km
   */
  avgStepLength: real("avg_step_length"),
  /**
   * Ground contact time in ms
   */
  avgStanceTime: real("avg_stance_time"),
  /**
   * Average vertical oscillation in cm
   */
  avgVerticalOscillation: real("avg_vertical_oscillation"),
  /**
   * Max cadence in steps per minute
   */
  maxCadence: integer("max_cadence"),
  /**
   * Avg cadence in steps per minute
   */
  avgCadence: integer("avg_cadence"),
  /**
   * Max heart rate in bpm
   */
  maxHeartRate: real("max_heart_rate"),
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
  exerciseId: integer("exercise_id")
    .references(() => exercisesTable.id)
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

import type { getTableColumns } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { externalDevicesTable } from "./ExternalDevice";
import { importJobsTable } from "./ImportJob";

export const heartRateTable = pgTable("heart_rate_readings", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  recordedAt: timestamp("recorded_at").notNull(),
  heartRate: integer("heart_rate").notNull(),
  heartRateMax: integer("heart_rate_max"),
  heartRateMin: integer("heart_rate_min"),
  timezone: text("timezone"),
  /**
   * Where the record came from
   */
  source: text("source"),

  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  /**
   * The id of the sleep record for the external provider
   */
  externalId: text("external_id"),
  /**
   * Canonical device this status maps to
   */
  externalDeviceId: text("external_device_id").references(() => externalDevicesTable.externalId),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
export type HeartRate = typeof heartRateTable.$inferSelect;
export type NewHeartRate = typeof heartRateTable.$inferInsert;

export type HeartRateColumns = keyof ReturnType<typeof getTableColumns<typeof heartRateTable>>;

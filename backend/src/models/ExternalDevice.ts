import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { devicesTable } from "./Device";
import { importJobsTable } from "./ImportJob";

/**
 * External / ingestion devices
 */
export const externalDevicesTable = pgTable("external_devices", {
  id: serial("id").primaryKey(),

  /**
   * External identifier from the source system (e.g. "shiba")
   */
  externalId: text("external_id").notNull(),

  /**
   * Source for this data to be imported
   */
  source: text("source").notNull(),

  /**
   * Canonical device this external device maps to
   */
  deviceId: integer("device_id").references(() => devicesTable.id),

  /**
   * Import job linkage
   */
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
export type ExternalDevice = typeof externalDevicesTable.$inferSelect;
export type NewExternalDevice = typeof externalDevicesTable.$inferInsert;

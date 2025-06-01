import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";
import type { getTableColumns } from "drizzle-orm";
import { sleepRecordsTable } from "./SleepRecord";

export const snoringRecordsTable = pgTable("snoring_records", {
  id: serial("id").primaryKey(),
  /**
   * Start time of the snoring record in UTC
   */
  startTime: timestamp("start_time").notNull(),
  /**
   * End time of the snoring record in UTC
   */
  endTime: timestamp("end_time").notNull(),
  /**
   * The timezone of the snoring record
   */
  timezone: text("timezone").notNull(),
  /**
   * The sleep record that the snoring belongs to
   * In the lomnia DB
   */
  sleepRecordId: integer("sleep_record_id")
    .references(() => sleepRecordsTable.id)
    .notNull(),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  dataExportId: text("data_export_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type SnoringRecord = typeof snoringRecordsTable.$inferSelect;
export type NewSnoringRecord = typeof snoringRecordsTable.$inferInsert;
export type SnoringRecordColumns = keyof ReturnType<typeof getTableColumns<typeof snoringRecordsTable>>;

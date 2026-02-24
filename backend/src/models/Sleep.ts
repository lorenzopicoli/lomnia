import type { getTableColumns } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";

export const sleepsTable = pgTable("sleeps", {
  id: serial("id").primaryKey(),
  /**
   * Bed time in UTC
   */
  startedAt: timestamp("started_at").notNull(),
  /**
   * Awake time in UTC
   */
  endedAt: timestamp("ended_at").notNull(),
  /**
   * Whether the sleep time was manually set by the user
   */
  isManuallyRecorded: boolean("is_manually_recorded").notNull(),
  /**
   * Sleep score that was manually set by the user
   */
  userScore: integer("user_score"),
  /**
   * Sleep score that was calculated by the external device
   */
  automaticScore: integer("automatic_score"),
  /**
   * Where the sleep record came from
   */
  source: text("source"),
  /**
   * Any additional comments the user has
   */
  comment: text("comment"),
  /**
   * The id of the sleep record in the samsung health export
   * Useful to link the sleep record to the sleep stages
   */
  externalId: text("external_id"),
  timezone: text("timezone"),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type Sleep = typeof sleepsTable.$inferSelect;
export type NewSleep = typeof sleepsTable.$inferInsert;
export type SleepColumns = keyof ReturnType<typeof getTableColumns<typeof sleepsTable>>;

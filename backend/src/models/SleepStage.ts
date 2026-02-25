import type { getTableColumns } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";
import { sleepsTable } from "./Sleep";

export const sleepStageEnumValues = ["awake", "light", "deep", "rem"] as const;
export const sleepStageEnum = pgEnum("sleep_stage", sleepStageEnumValues);

export const sleepStagesTable = pgTable("sleep_stages", {
  id: serial("id").primaryKey(),
  /**
   * Start time of the sleep stage in UTC
   */
  startedAt: timestamp("started_at").notNull(),
  /**
   * End time of the sleep stage in UTC
   */
  endedAt: timestamp("ended_at").notNull(),
  /**
   * Timezone of the sleep stage
   */
  timezone: text("timezone"),
  /**
   * The stage of the sleep
   */
  stage: sleepStageEnum("stage").notNull(),
  /**
   * Where the sleep stage record came from
   */
  source: text("source"),
  /**
   * The sleep record that the sleep stage belongs to
   */
  sleepId: text("sleep_id")
    .references(() => sleepsTable.id)
    .notNull(),
  /**
   * The external sleep id
   */
  externalId: text("external_id"),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type SleepStage = typeof sleepStagesTable.$inferSelect;
export type NewSleepStage = typeof sleepStagesTable.$inferInsert;
export type SleepStageColumns = keyof ReturnType<typeof getTableColumns<typeof sleepStagesTable>>;

import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { sleepRecordsTable } from './SleepRecord'
import { importJobsTable } from './ImportJob'
import type { getTableColumns } from 'drizzle-orm'

const sleepStageEnum = pgEnum('sleep_stage', ['awake', 'light', 'deep', 'rem'])

export const sleepStagesTable = pgTable('sleep_stages', {
  id: serial('id').primaryKey(),
  /**
   * Start time of the sleep stage in UTC
   */
  startTime: timestamp('start_time').notNull(),
  /**
   * End time of the sleep stage in UTC
   */
  endTime: timestamp('end_time').notNull(),
  /**
   * Timezone of the sleep stage
   */
  timezone: text('timezone').notNull(),
  /**
   * The stage of the sleep
   */
  stage: sleepStageEnum('stage').notNull(),
  /**
   * The sleep record that the sleep stage belongs to
   * In the lomnia DB
   */
  sleepRecordId: integer('sleep_record_id')
    .references(() => sleepRecordsTable.id)
    .notNull(),
  /**
   * The sleep record that the sleep stage belongs to
   * In samsung's export
   */
  samsungSleepId: uuid('samsung_sleep_id'),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  dataExportId: text('data_export_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type SleepStage = typeof sleepStagesTable.$inferSelect
export type NewSleepStage = typeof sleepStagesTable.$inferInsert
export type SleepStageColumns = keyof ReturnType<
  typeof getTableColumns<typeof sleepStagesTable>
>

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { importJobsTable } from './ImportJob'
import type { getTableColumns } from 'drizzle-orm'

export const sleepRecordSourceEnum = pgEnum('source', [
  'obsidian',
  'samsung_health',
])
export const sleepRecordsTable = pgTable('sleep_records', {
  id: serial('id').primaryKey(),
  /**
   * Bed time in UTC
   */
  bedTime: timestamp('bed_time').notNull(),
  /**
   * Awake time in UTC
   */
  awakeTime: timestamp('awake_time').notNull(),
  /**
   * Whether the sleep time was manually set by the user
   */
  isSleepTimeManual: boolean('is_sleep_time_manual').notNull(),
  /**
   * Sleep score that was manually set by the user
   */
  sleepScoreManual: integer('sleep_score_manual'),
  /**
   * Sleep score that was calculated by the external device
   */
  sleepScoreExternal: integer('sleep_score_external'),
  /**
   * Where the sleep record came from
   */
  source: sleepRecordSourceEnum('source'),
  /**
   * The amount of time spent in mental recovery
   * Currently set by samsung health only
   */
  mentalRecovery: integer('mental_recovery'),
  /**
   * The amount of time spent in physical recovery
   * Currently set by samsung health only
   */
  physicalRecovery: integer('physical_recovery'),
  /**
   * The amount of sleep cycles
   * Currently set by samsung health only
   */
  sleepCycles: integer('sleep_cycles'),
  /**
   * The efficiency of the sleep
   * Currently set by samsung health only
   */
  efficiency: integer('efficiency'),
  /**
   * Any additional comments the user has
   */
  comment: text('comment'),
  /**
   * The id of the sleep record in the samsung health export
   * Useful to link the sleep record to the sleep stages
   */
  samsungSleepId: uuid('samsung_sleep_id'),
  timezone: text('timezone').notNull(),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  dataExportId: text('data_export_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type SleepRecord = typeof sleepRecordsTable.$inferSelect
export type NewSleepRecord = typeof sleepRecordsTable.$inferInsert
export type SleepRecordColumns = keyof ReturnType<
  typeof getTableColumns<typeof sleepRecordsTable>
>

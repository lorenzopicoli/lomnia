import {
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { importJobsTable } from './ImportJob'
import type { getTableColumns } from 'drizzle-orm'

export const stepCountTable = pgTable('step_counts', {
  id: serial('id').primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  walkStep: integer('walk_step').notNull(),
  runStep: integer('run_step').notNull(),
  stepCount: integer('step_count').notNull(),
  /**
   * Speed in meters per second during the activity
   */
  speed: real('speed'),
  /**
   * Distance in meters during the activity
   */
  distance: real('distance'),
  /**
   * Burned calories in kilocalories during the activity
   */
  calories: real('calories'),
  timezone: text('timezone').notNull(),

  dataExportId: text('data_export_id').notNull(),

  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})
export type StepCount = typeof stepCountTable.$inferSelect
export type NewStepCount = typeof stepCountTable.$inferInsert

export type StepCountColumns = keyof ReturnType<
  typeof getTableColumns<typeof stepCountTable>
>

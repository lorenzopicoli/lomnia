import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { importJobsTable } from './ImportJob'
import type { getTableColumns } from 'drizzle-orm'

export const heartRateReadingsTable = pgTable('heart_rate_readings', {
  id: serial('id').primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  heartRate: integer('heart_rate').notNull(),
  heartRateMax: integer('heart_rate_max').notNull(),
  heartRateMin: integer('heart_rate_min').notNull(),
  timezone: text('timezone').notNull(),
  comment: text('comment'),
  binUuid: uuid('bin_uuid'),

  dataExportId: text('data_export_id').notNull(),

  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})
export type HeartRateReading = typeof heartRateReadingsTable.$inferSelect
export type NewHeartRateReading = typeof heartRateReadingsTable.$inferInsert

export type HeartRateReadingColumns = keyof ReturnType<
  typeof getTableColumns<typeof heartRateReadingsTable>
>

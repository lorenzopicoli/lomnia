import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { customJsonb } from '../db/types'
import { filesTable } from './File'
import { importJobsTable } from './ImportJob'

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  fileId: integer('file_id').references(() => filesTable.id),

  /**
   * It's expected to be of the type HabitsKey
   */
  key: text('key'),
  /**
   * Code that relies on this should support:
   * - dates
   * - booleans
   * - string
   * - numbers
   *
   * This should not have any JSON shape. For example:
   * value: 1 instead of value: { "value": 1 }
   */
  value: customJsonb('value'),

  /**
   * Date in the user timezone of when this habit was recorded.
   * TODO: add a timezone column to this table
   */
  date: date('date'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type Habit = typeof habitsTable.$inferSelect
export type NewHabit = typeof habitsTable.$inferInsert

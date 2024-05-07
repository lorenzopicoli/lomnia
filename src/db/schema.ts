import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { geography } from './customTypes'

export const batteryStatusEnum = pgEnum('battery_status', [
  'unknown',
  'unplugged',
  'charging',
  'full',
])

export const connectionStatusEnum = pgEnum('connection_status', [
  'wifi',
  'offline',
  'data',
])

export const locationTriggerEnum = pgEnum('trigger', [
  'ping',
  'circular',
  'report_location',
  'manual',
])

export const importJobsTable = pgTable('import_jobs', {
  id: serial('id').primaryKey(),
  jobStart: timestamp('job_start').notNull(),
  jobEnd: timestamp('job_end').notNull(),
  firstEntryDate: timestamp('first_entry_date').notNull(),
  lastEntryDate: timestamp('last_entry_date').notNull(),
  /***
   * The column/key used to populate the entry dates
   */
  entryDateKey: text('entry_date_key').notNull(),
  destinationTable: text('destination_table').notNull(),
  source: text('source').notNull(),
  importedCount: integer('imported_count').notNull(),
  logs: jsonb('logs').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
})
export type ImportJob = typeof importJobsTable.$inferSelect

export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  externalId: integer('external_id').notNull(),
  /***
   * In meters
   */
  accuracy: integer('accuracy'),
  /***
   * In meters
   */
  verticalAccuracy: integer('vertical_accuracy'),
  /***
   * In km/h
   */
  velocity: integer('velocity'),
  /***
   * In meters
   */
  altitude: integer('altitude'),
  /***
   * In percent
   */
  battery: integer('battery'),
  batteryStatus: batteryStatusEnum('battery_status').notNull(),
  connectionStatus: connectionStatusEnum('connection_status'),
  location: geography('location').notNull(),

  trigger: locationTriggerEnum('trigger'),

  topic: text('topic'),
  wifiSSID: text('wifi_ssid'),
  rawData: jsonb('raw_data'),

  importJobId: integer('import_job_id').references(() => importJobsTable.id),

  messageCreatedAt: timestamp('message_created_at'),
  locationFix: timestamp('location_fix'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export type Location = typeof locationsTable.$inferSelect
export type NewLocation = typeof locationsTable.$inferInsert

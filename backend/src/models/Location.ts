import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { geography } from '../db/types'
import { importJobsTable } from './ImportJob'
import { dailyWeatherTable, hourlyWeatherTable } from './Weather'
import { locationDetailsTable } from './LocationDetails'

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

  /**
   * The user timezone at the time of the location recording.
   * If the source doesn't provide this, use the "ts-node" library
   * to find the timezone
   */
  timezone: text('timezone').notNull(),
  wifiSSID: text('wifi_ssid'),

  /**
   * The original data that came from the source DB. This might be a bit too much
   * and take too much disk space
   */
  rawData: jsonb('raw_data'),

  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),

  messageCreatedAt: timestamp('message_created_at').defaultNow(),

  /**
   * The date at which the date was taken, in UTC time
   */
  locationFix: timestamp('location_fix'),

  /**
   * If the call to the reverse geocoding API failed and we should not try again
   */
  failedToReverseGeocode: boolean('failed_to_reverse_geocode').default(false),

  /**
   * The details for this location entry
   */
  locationDetailsId: integer('location_details_id').references(
    () => locationDetailsTable.id
  ),

  /**
   * The daily weather entry that covers this location at the time that
   * this was recorded (location_fix)
   */
  dailyWeatherId: integer('daily_weather_id').references(
    () => dailyWeatherTable.id
  ),
  /**
   * The hourly weather entry that covers this location at the time that
   * this was recorded (location_fix)
   */
  hourlyWeatherId: integer('hourly_weather_id').references(
    () => hourlyWeatherTable.id
  ),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type Location = typeof locationsTable.$inferSelect
export type NewLocation = typeof locationsTable.$inferInsert

import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { customJsonb, geography } from './types'

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

export const filesSourceEnum = pgEnum('files_source', ['obsidian'])
export const filesContentTypeEnum = pgEnum('files_content_type', ['markdown'])

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  timezone: text('timezone').notNull(),
  wifiSSID: text('wifi_ssid'),
  rawData: jsonb('raw_data'),

  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),

  messageCreatedAt: timestamp('message_created_at').defaultNow(),
  locationFix: timestamp('location_fix'),

  dailyWeatherId: integer('daily_weather_id').references(
    () => dailyWeatherTable.id
  ),
  hourlyWeatherId: integer('hourly_weather_id').references(
    () => hourlyWeatherTable.id
  ),

  dailyWeatherAttempts: integer('daily_weather_attempts'),
  hourlyWeatherAttempts: integer('hourly_weather_attempts'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type Location = typeof locationsTable.$inferSelect
export type NewLocation = typeof locationsTable.$inferInsert

export const filesTable = pgTable('files', {
  id: serial('id').primaryKey(),
  source: filesSourceEnum('source').notNull(),
  contentType: filesContentTypeEnum('content_type').notNull(),
  metadata: customJsonb('metadata'),
  checksum: text('checksum'),
  tags: text('tags').array(),
  fileCreatedAt: timestamp('file_created_at').defaultNow().notNull(),
  fileUpdatedAt: timestamp('file_updated_at'),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  /***
   * Relative to the base folder from import
   */
  relativePath: text('relative_path').notNull(),
  content: text('content'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type File = typeof filesTable.$inferSelect
export type NewFile = typeof filesTable.$inferInsert

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  fileId: integer('file_id').references(() => filesTable.id),

  key: text('key'),
  value: customJsonb('value'),
  date: date('date'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type Habit = typeof habitsTable.$inferSelect
export type NewHabit = typeof habitsTable.$inferInsert

export const dnsQueriesTable = pgTable('dns_queries', {
  id: integer('id'),
  externalId: integer('external_id'),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  queryTimestamp: timestamp('query_timestamp').notNull(),
  domain: text('domain').notNull(),
  client: text('client').notNull(),
  forward: text('forward'),
  replyTime: integer('reply_time'),
  additionalInfo: jsonb('additional_info'),
  // 1 	A
  // 2 	AAAA
  // 3 	ANY
  // 4 	SRV
  // 5 	SOA
  // 6 	PTR
  // 7 	TXT
  // 8 	NAPTR
  // 9 	MX
  // 10 	DS
  // 11 	RRSIG
  // 12 	DNSKEY
  // 13 	NS
  // 14 	OTHER (any query type not covered elsewhere, but see note below)
  // 15 	SVCB
  // 16 	HTTPS
  type: integer('type').notNull(),
  // 0 	Unknown 	❔ 	Unknown status (not yet known)
  // 1 	Blocked 	❌ 	Domain contained in gravity database
  // 2 	Allowed 	✅ 	Forwarded
  // 3 	Allowed 	✅ 	Replied from cache
  // 4 	Blocked 	❌ 	Domain matched by a regex blacklist filter
  // 5 	Blocked 	❌ 	Domain contained in exact blacklist
  // 6 	Blocked 	❌ 	By upstream server (known blocking page IP address)
  // 7 	Blocked 	❌ 	By upstream server (0.0.0.0 or ::)
  // 8 	Blocked 	❌ 	By upstream server (NXDOMAIN with RA bit unset)
  // 9 	Blocked 	❌ 	Domain contained in gravity database
  // Blocked during deep CNAME inspection
  // 10 	Blocked 	❌ 	Domain matched by a regex blacklist filter
  // Blocked during deep CNAME inspection
  // 11 	Blocked 	❌ 	Domain contained in exact blacklist
  // Blocked during deep CNAME inspection
  // 12 	Allowed 	✅ 	Retried query
  // 13 	Allowed 	✅ 	Retried but ignored query (this may happen during ongoing DNSSEC validation)
  // 14 	Allowed 	✅ 	Already forwarded, not forwarding again
  // 15 	Blocked 	❌ 	Blocked (database is busy)
  // How these queries are handled can be configured
  // 16 	Blocked 	❌ 	Blocked (special domain)
  // E.g. Mozilla's canary domain and Apple's Private Relay domains
  // Handling can be configured
  // 17 	Allowed 	✅⌛ 	Replied from stale cache
  status: integer('status').notNull(),
  // 0 	unknown (no reply so far)
  // 1 	NODATA
  // 2 	NXDOMAIN
  // 3 	CNAME
  // 4 	a valid IP record
  // 5 	DOMAIN
  // 6 	RRNAME
  // 7 	SERVFAIL
  // 8 	REFUSED
  // 9 	NOTIMP
  // 10 	OTHER
  // 11 	DNSSEC
  // 12 	NONE (query was dropped intentionally)
  // 13 	BLOB (binary data)
  replyType: integer('reply_type').notNull(),
  // 0 	unknown
  // 1 	SECURE
  // 2 	INSECURE
  // 3 	BOGUS
  // 4 	ABANDONED
  dnssec: integer('dnssec'),
})

export type DnsQuery = typeof dnsQueriesTable.$inferSelect
export type NewDnsQuery = typeof dnsQueriesTable.$inferInsert

export const hourlyWeatherTable = pgTable('hourly_weather', {
  id: serial('id').primaryKey(),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  date: timestamp('date').notNull(),
  timezone: text('timezone').notNull(),

  temperature2m: real('temperature2m'),
  relativeHumidity2m: real('relative_humidity2m'),
  apparentTemperature: real('apparent_temperature'),
  precipitation: real('precipitation'),
  rain: real('rain'),
  snowfall: real('snowfall'),
  snowDepth: real('snow_depth'),
  weatherCode: integer('weather_code'),
  cloudCover: real('cloud_cover'),
  windSpeed10m: real('wind_speed10m'),
  windSpeed100m: real('wind_speed100m'),
  location: geography('location').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type HourlyWeather = typeof hourlyWeatherTable.$inferSelect
export type NewHourlyWeather = typeof hourlyWeatherTable.$inferInsert

export const dailyWeatherTable = pgTable('daily_weather', {
  id: serial('id').primaryKey(),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  date: date('date').notNull(),

  weatherCode: integer('weather_code'),
  temperature2mMax: real('temperature2m_max'),
  temperature2mMin: real('temperature2m_min'),
  temperature2mMean: real('temperature2m_mean'),
  apparentTemperatureMax: real('apparent_temperature_max'),
  apparentTemperatureMin: real('apparent_temperature_min'),
  sunrise: timestamp('sunrise'),
  sunset: timestamp('sunset'),
  daylightDuration: real('daylight_duration'),
  sunshineDuration: real('sunshine_duration'),
  rainSum: real('rain_sum'),
  snowfallSum: real('snowfall_sum'),
  location: geography('location').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type DailyWeather = typeof dailyWeatherTable.$inferSelect
export type NewDailyWeather = typeof dailyWeatherTable.$inferInsert

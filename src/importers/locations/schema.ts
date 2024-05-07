import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const importerLocationsEventsTable = sqliteTable('location_events', {
  id: integer('rowid'),
  accuracy: integer('accuracy'),
  verticalAccuracy: integer('vertical_accuracy'),
  velocity: integer('velocity'),
  altitude: integer('altitude'),
  /***
   * Missing in real DB
   */
  courseOverGround: integer('course_over_ground'),
  radius: integer('radius'),
  battery: integer('battery_level'),
  monitoringMode: integer('monitoring_mode'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  /***
   * Missing in real DB
   */
  barometricPressure: real('barometric_pressure'),
  triggerType: text('trigger_type'),
  pointOfInterest: text('point_of_interest'),
  /***
   * Missing in real DB
   */
  trackerId: text('tracker_id'),
  timestamp: integer('timestamp', { mode: 'timestamp' }),
  connectionStatus: text('connectivity_status'),
  batteryStatus: integer('battery_status'),
  /***
   * Missing in real DB
   */
  tagName: text('tag_name'),
  originalPublishTopic: text('original_publish_topic'),
  /***
   * Missing in real DB
   */
  regionIdsCurrentlyIn: text('region_ids_currently_in', { mode: 'json' }),
  /***
   * Missing in real DB
   */
  regionCurrentlyIn: text('regions_currently_in', { mode: 'json' }),
  wifiSSID: text('wifi_ssid'),
  /***
   * Missing in real DB
   */
  wifiBSSID: text('wifi_bssid'),
  messageCreationTime: integer('message_creation_time', { mode: 'timestamp' }),
})

export type ImporterLocation = typeof importerLocationsEventsTable.$inferSelect

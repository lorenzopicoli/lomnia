import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";

export const deviceBatteryStatusEnum = pgEnum("device_battery_status", ["unknown", "unplugged", "charging", "full"]);
export const deviceConnectionStatusEnum = pgEnum("device_connection_status", [
  "wifi",
  "offline",
  "cellular",
  "ethernet",
]);

/**
 * Device status events
 */
export const deviceStatusTable = pgTable("device_statuses", {
  id: serial("id").primaryKey(),

  /**
   * Device linked to this status
   */
  deviceId: text("device_id"),

  /**
   * External identifier from the source system
   */
  externalId: text("external_id"),

  /**
   * The application source used to get this device status
   */
  source: text("source").notNull(),

  /**
   * Battery level in percent
   */
  battery: integer("battery"),

  /**
   * Current battery status
   */
  batteryStatus: deviceBatteryStatusEnum("battery_status"),

  /**
   * Current connection status
   */
  connectionStatus: deviceConnectionStatusEnum("connection_status"),

  /**
   * The user timezone at the time of recording
   */
  timezone: text("timezone").notNull(),

  /**
   * WiFi network name if connected
   */
  wifiSSID: text("wifi_ssid"),

  /**
   * When this status was recorded (UTC)
   */
  recordedAt: timestamp("recorded_at").notNull(),

  /**
   * Import job linkage
   */
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type DeviceStatus = typeof deviceStatusTable.$inferSelect;
export type NewDeviceStatus = typeof deviceStatusTable.$inferInsert;

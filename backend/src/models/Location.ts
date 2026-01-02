import { boolean, integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { geography } from "../db/types";
import { importJobsTable } from "./ImportJob";
import { locationDetailsTable } from "./LocationDetails";
import { dailyWeatherTable, hourlyWeatherTable } from "./Weather";

export const locationTriggerEnum = pgEnum("trigger", ["ping", "circular", "report_location", "manual"]);

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  /***
   * The application source used to get this location
   */
  source: text("source").notNull(),
  /***
   * The source used to get this location in the device (eg. network, gps, fused)
   */
  gpsSource: text("gps_source"),
  /***
   * In meters
   */
  accuracy: integer("accuracy"),
  /***
   * In meters
   */
  verticalAccuracy: integer("vertical_accuracy"),
  /***
   * In km/h
   */
  velocity: integer("velocity"),
  /***
   * In meters
   */
  altitude: integer("altitude"),

  location: geography("location").notNull(),

  trigger: locationTriggerEnum("trigger"),

  topic: text("topic"),

  /**
   * The user timezone at the time of the location recording.
   * If the source doesn't provide this, use the "ts-node" library
   * to find the timezone
   */
  timezone: text("timezone").notNull(),

  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  /**
   * The date at which the location was taken, in UTC time
   */
  recordedAt: timestamp("recorded_at"),

  /**
   * If the call to the reverse geocoding API failed and we should not try again
   */
  failedToReverseGeocode: boolean("failed_to_reverse_geocode").default(false),

  /**
   * The details for this location entry
   */
  locationDetailsId: integer("location_details_id").references(() => locationDetailsTable.id),

  /**
   * The daily weather entry that covers this location at the time that
   * this was recorded (recorded_at)
   */
  dailyWeatherId: integer("daily_weather_id").references(() => dailyWeatherTable.id),
  /**
   * The hourly weather entry that covers this location at the time that
   * this was recorded (recorded_at)
   */
  hourlyWeatherId: integer("hourly_weather_id").references(() => hourlyWeatherTable.id),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

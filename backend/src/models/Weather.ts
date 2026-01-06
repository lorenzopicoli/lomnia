import type { getTableColumns } from "drizzle-orm";
import { date, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { geography } from "../db/types";
import { importJobsTable } from "./ImportJob";

export const hourlyWeatherTable = pgTable("hourly_weather", {
  id: serial("id").primaryKey(),

  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  /**
   * Timestamp in UTC of the START time for this weather recording.
   * This means that date + 1 hour is the end of this recording.
   * Not to be confused with the "date" in dailyWeatherTable which is
   * NOT in UTC and is NOT a timestamp
   */
  date: timestamp("date").notNull(),
  /**
   * The timezone for the location of this weather recording
   */
  timezone: text("timezone").notNull(),

  /**
   * In celcius
   */
  temperature2m: real("temperature2m"),
  /**
   * In %
   */
  relativeHumidity2m: real("relative_humidity2m"),
  /**
   * In celcius
   */
  apparentTemperature: real("apparent_temperature"),
  /**
   * In mm
   */
  precipitation: real("precipitation"),
  /**
   * In mm
   */
  rain: real("rain"),
  /**
   * In cm
   */
  snowfall: real("snowfall"),
  /**
   * In m
   */
  snowDepth: real("snow_depth"),
  /**
   * WMO code:
   *
   * 0 	Clear sky
   *
   * 1, 2, 3 	Mainly clear, partly cloudy, and overcast
   *
   * 45, 48 	Fog and depositing rime fog
   *
   * 51, 53, 55 	Drizzle: Light, moderate, and dense intensity
   *
   * 56, 57 	Freezing Drizzle: Light and dense intensity
   *
   * 61, 63, 65 	Rain: Slight, moderate and heavy intensity
   *
   * 66, 67 	Freezing Rain: Light and heavy intensity
   *
   * 71, 73, 75 	Snow fall: Slight, moderate, and heavy intensity
   *
   * 77 	Snow grains
   *
   * 80, 81, 82 	Rain showers: Slight, moderate, and violent
   *
   * 85, 86 	Snow showers slight and heavy
   *
   * 95 * 	Thunderstorm: Slight or moderate
   *
   * 96, 99 * 	Thunderstorm with slight and heavy hail
   */
  weatherCode: integer("weather_code"),

  /**
   *  % 	Total cloud cover as an area fraction
   */
  cloudCover: real("cloud_cover"),
  /**
   * In km/h
   */
  windSpeed10m: real("wind_speed10m"),
  /**
   * In km/h
   */
  windSpeed100m: real("wind_speed100m"),
  /**
   * The location used to fetch this weather record OR the nearest grid location.
   * This will be a point in a grid created by SnapToGrid with 0.01 precision
   *
   * More info: https://postgis.net/docs/ST_SnapToGrid.html
   */
  location: geography("location").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type HourlyWeather = typeof hourlyWeatherTable.$inferSelect;
export type NewHourlyWeather = typeof hourlyWeatherTable.$inferInsert;
export type HourlyWeatherColumns = keyof ReturnType<typeof getTableColumns<typeof hourlyWeatherTable>>;

export const dailyWeatherTable = pgTable("daily_weather", {
  id: serial("id").primaryKey(),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  /**
   * The date in the user's timezone (see timezone column)
   */
  date: date("date").notNull(),

  /**
   * See as hourly_weather weather_code
   */
  weatherCode: integer("weather_code"),
  /**
   * In celsius
   */
  temperature2mMax: real("temperature2m_max"),
  /**
   * In celsius
   */
  temperature2mMin: real("temperature2m_min"),
  /**
   * In celsius
   */
  temperature2mMean: real("temperature2m_mean"),
  /**
   * In celsius
   */
  apparentTemperatureMax: real("apparent_temperature_max"),
  /**
   * In celsius
   */
  apparentTemperatureMin: real("apparent_temperature_min"),
  /**
   * In UTC
   */
  sunrise: timestamp("sunrise"),
  /**
   * In UTC
   */
  sunset: timestamp("sunset"),
  /**
   * Number of seconds of daylight per day
   */
  daylightDuration: real("daylight_duration"),
  /**
   * The number of seconds of sunshine per day is determined by calculating direct normalized irradiance exceeding 120 W/m²,
   * following the WMO definition. Sunshine duration will consistently be less than daylight duration due to dawn and dusk.
   */
  sunshineDuration: real("sunshine_duration"),
  /**
   * In mm
   */
  rainSum: real("rain_sum"),
  /**
   * In cm
   */
  snowfallSum: real("snowfall_sum"),
  /**
   * The location used to fetch this weather record OR the nearest grid location.
   * This will be a point in a grid created by SnapToGrid with 0.01 precision
   *
   * More info: https://postgis.net/docs/ST_SnapToGrid.html
   */
  location: geography("location").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DailyWeather = typeof dailyWeatherTable.$inferSelect;
export type NewDailyWeather = typeof dailyWeatherTable.$inferInsert;

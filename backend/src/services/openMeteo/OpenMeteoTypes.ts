import type { DateTime } from "luxon";
import { z } from "zod";
import type { Point } from "../../db/types";

// ----------------------------------------------------------------------------------------
// The features that we use to fetch OpenMeteo, but separated in variables that makes
// typing a bit easier
// ----------------------------------------------------------------------------------------
export const dailyStringParams = ["sunrise" as const, "sunset" as const];
export const dailyNumberParams = [
  "temperature_2m_max" as const,
  "temperature_2m_min" as const,
  "temperature_2m_mean" as const,
  "apparent_temperature_max" as const,
  "apparent_temperature_min" as const,
  "daylight_duration" as const,
  "sunshine_duration" as const,
  "rain_sum" as const,
  "snowfall_sum" as const,
  "weather_code" as const,
];

export const openMeteoApiParams = {
  hourly: [
    "temperature_2m" as const,
    "relative_humidity_2m" as const,
    "apparent_temperature" as const,
    "precipitation" as const,
    "rain" as const,
    "snowfall" as const,
    "snow_depth" as const,
    "weather_code" as const,
    "cloud_cover" as const,
    "wind_speed_10m" as const,
    "wind_speed_100m" as const,
  ],
  daily: [...dailyNumberParams, ...dailyStringParams],
};

// ----------------------------------------------------------------------------------------
// The actual type that is sent to their servers
// ----------------------------------------------------------------------------------------
export interface OpenMeteoApiHourlyParams {
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  timeformat: "unixtime";
  hourly: typeof openMeteoApiParams.hourly;
}

export interface OpenMeteoApiDailyParams {
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  timezone: string;
  daily: typeof openMeteoApiParams.daily;
}

// ----------------------------------------------------------------------------------------
// Zod types for API responses for validation because I don't trust their openai specs
// and also because they stop working very quickly
// ----------------------------------------------------------------------------------------
export const HourlySchema = z.object({
  data: z.object({
    hourly: z
      .object({
        time: z.array(z.number()),
      })
      .and(z.record(z.enum(openMeteoApiParams.hourly), z.array(z.number().or(z.null())))),
  }),
});

export type Hourly = z.infer<typeof HourlySchema>;

export const DailySchema = z.object({
  data: z.object({
    utc_offset_seconds: z.number(),
    daily: z
      .object({
        time: z.array(z.string()),
      })
      .and(z.record(z.enum(dailyNumberParams), z.array(z.number().or(z.null()))))
      .and(z.record(z.enum(dailyStringParams), z.array(z.string().or(z.null())))),
  }),
});

export type Daily = z.infer<typeof DailySchema>;

/**
 * The response given by the OpenMeteo class when fetching historical data
 */
export interface OpenMeteoHistoricalResponse {
  hourly: Array<{
    /**
     * In UTC
     */
    date: DateTime;
    timezone: string;
    temperature2m: number | null;
    relativeHumidity2m: number | null;
    apparentTemperature: number | null;
    precipitation: number | null;
    rain: number | null;
    snowfall: number | null;
    snowDepth: number | null;
    weatherCode: number | null;
    cloudCover: number | null;
    windSpeed10m: number | null;
    windSpeed100m: number | null;
    location: Point;
  }>;
  daily: Array<{
    /**
     * The day in "YYYY-MM-DD" format IN THE USER TIMEZONE
     */
    day: string;
    location: Point;

    weatherCode: number | null;
    temperature2mMax: number | null;
    temperature2mMin: number | null;
    temperature2mMean: number | null;
    apparentTemperatureMax: number | null;
    apparentTemperatureMin: number | null;
    /**
     * In UTC
     */
    sunrise: DateTime | null;
    /**
     * In UTC
     */
    sunset: DateTime | null;

    daylightDuration: number | null;
    sunshineDuration: number | null;
    rainSum: number | null;
    snowfallSum: number | null;
  }>;
}

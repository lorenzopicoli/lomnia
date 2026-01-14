import { z } from "zod";
import type { Point } from "../../db/types";
import { Logger } from "../Logger";
import type { paths } from "./gen/openMeteoOpenApiTypes";
import createClient from "openapi-fetch";
import { DateTime, FixedOffsetZone } from "luxon";

const dailyStringParams = ["sunrise" as const, "sunset" as const];
const dailyNumberParams = [
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

const apiParams = {
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

export const HourlySchema = z
  .object({
    time: z.array(z.string()),
  })
  .and(z.record(z.enum(apiParams.hourly), z.array(z.number())));

export type Hourly = z.infer<typeof HourlySchema>;

export const DailySchema = z
  .object({
    time: z.array(z.string()),
  })
  .and(z.record(z.enum(dailyNumberParams), z.array(z.number())))
  .and(z.record(z.enum(dailyStringParams), z.array(z.string())));

export type Daily = z.infer<typeof DailySchema>;

export interface OpenMeteoHistoricalResponse {
  hourly: Array<{
    /**
     * In UTC
     */
    date: DateTime;
    timezone: string;
    temperature2m: number;
    relativeHumidity2m: number;
    apparentTemperature: number;
    precipitation: number;
    rain: number;
    snowfall: number;
    snowDepth: number;
    weatherCode: number;
    cloudCover: number;
    windSpeed10m: number;
    windSpeed100m: number;
    location: Point;
  }>;
  daily: Array<{
    /**
     * The day in "YYYY-MM-DD" format IN THE USER TIMEZONE
     */
    day: string;
    location: Point;

    weatherCode: number;
    temperature2mMax: number;
    temperature2mMin: number;
    temperature2mMean: number;
    apparentTemperatureMax: number;
    apparentTemperatureMin: number;
    /**
     * In UTC
     */
    sunrise: DateTime;
    /**
     * In UTC
     */
    sunset: DateTime;

    daylightDuration: number;
    sunshineDuration: number;
    rainSum: number;
    snowfallSum: number;
  }>;
}

/**
 * TODO: Add rate limiting in here
 */
export class OpenMeteo {
  static apiVersion = "v1" as const;
  private apiUrl = `https://archive-api.open-meteo.com`;
  protected logger = new Logger("OpenMeteoAPI");

  private http = createClient<paths>({ baseUrl: this.apiUrl });

  /**
   * Fetches historical weather data for a list of places for a given period
   *
   * TODO: Return cached response if we have cached data for all locations for all of the dates, otherwise calls the API
   *
   * @params.startDate in format YYYY-MM-DD
   * @params.endDate in format YYYY-MM-DD
   */
  public async fetchHistorical(params: { point: Point; startDate: string; endDate: string; timezone: string }) {
    const { point, startDate, endDate, timezone } = params;

    const result = await this.http.GET(`/${OpenMeteo.apiVersion}/archive`, {
      params: {
        query: {
          latitude: point.lat,
          longitude: point.lng,
          timezone: timezone,
          start_date: startDate,
          end_date: endDate,
          // timeformat: "unixtime",
          ...apiParams,
        },
      },
    });

    if (!result.data) {
      this.logger.error("Failed to get OpenMeteo Historical data", {
        latitude: point.lat,
        longitude: point.lng,
        timezone: timezone,
        start_date: startDate,
        end_date: endDate,
        ...apiParams,
      });
      return null;
    }

    const { utc_offset_seconds: utcOffsetSeconds, hourly: hourlyRaw, daily: dailyRaw } = result.data;

    if (!hourlyRaw || !dailyRaw) {
      this.logger.error("Failed to get OpenMeteo Historical hourly/daily");
      return null;
    }

    const hourly = z.parse(HourlySchema, hourlyRaw);
    const daily = z.parse(DailySchema, dailyRaw);

    const hourlyResult: OpenMeteoHistoricalResponse["hourly"] = [];
    const dailyResult: OpenMeteoHistoricalResponse["daily"] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const date = DateTime.fromISO(hourly.time[i], { zone: timezone });
      console.log("My offset", date.offset * 60);
      console.log("Their offset", utcOffsetSeconds);
      hourlyResult.push({
        date: date.toUTC(),
        apparentTemperature: hourly.apparent_temperature[i],
        temperature2m: hourly.temperature_2m[i],
        relativeHumidity2m: hourly.relative_humidity_2m[i],
        precipitation: hourly.precipitation[i],
        rain: hourly.rain[i],
        snowfall: hourly.snowfall[i],
        snowDepth: hourly.snow_depth[i],
        weatherCode: hourly.weather_code[i],
        cloudCover: hourly.cloud_cover[i],
        windSpeed100m: hourly.wind_speed_100m[i],
        windSpeed10m: hourly.wind_speed_10m[i],

        timezone,
        location: point,
      });
    }

    for (let i = 0; i < daily.time.length; i++) {
      dailyResult.push({
        day: daily.time[i],

        location: point,

        weatherCode: daily.weather_code[i],
        temperature2mMax: daily.temperature_2m_max[i],
        temperature2mMin: daily.temperature_2m_min[i],
        temperature2mMean: daily.temperature_2m_mean[i],
        apparentTemperatureMax: daily.apparent_temperature_max[i],
        apparentTemperatureMin: daily.apparent_temperature_min[i],
        sunrise: DateTime.fromISO(daily.time[i], { zone: "UTC" }),
        sunset: DateTime.fromISO(daily.time[i], { zone: "UTC" }),

        daylightDuration: daily.daylight_duration[i],
        sunshineDuration: daily.sunshine_duration[i],
        rainSum: daily.rain_sum[i],
        snowfallSum: daily.snowfall_sum[i],
      });
    }

    return { hourly: hourlyResult, daily: dailyResult };
    // return fetchWeatherApi(this.apiUrl, meteoParams);
  }
}

import { omit } from "lodash";
import { DateTime, FixedOffsetZone } from "luxon";
import createClient from "openapi-fetch";
import { z } from "zod";
import type { Point } from "../../db/types";
import type { NewDailyWeather, NewHourlyWeather } from "../../models";
import type { Exact } from "../../types/exact";
import { Logger } from "../Logger";
import type { paths } from "./gen/openMeteoOpenApiTypes";
import { OpenMeteoCache } from "./OpenMeteoCache";
import {
  DailySchema,
  HourlySchema,
  type OpenMeteoApiDailyParams,
  type OpenMeteoApiHourlyParams,
  type OpenMeteoHistoricalResponse,
  openMeteoApiParams,
} from "./OpenMeteoTypes";

/**
 * TODO: Add rate limiting in here
 */
export class OpenMeteo {
  static apiVersion = "v1" as const;
  private apiUrl = `https://archive-api.open-meteo.com`;
  private cache = OpenMeteoCache.init();
  protected logger = new Logger("OpenMeteoAPI");

  // Requests for 14 days are counted the same as requests for 1 day
  private pastDaysPadding = 2;
  private futureDaysPadding = 10;
  private http = createClient<paths>({ baseUrl: this.apiUrl });

  /**
   * Fetches historical weather data for a location based on a date.
   * In reality since it's the same cost (and because of timezone issues on OpenMeteo's side), we fetch data for
   * 6 days before and after the requested date. This ends up being pretty good since there's a good chance that
   * the user will be in the same area for the next 6 days (ie. their home).
   *
   * All dates and times returned from this call are in UTC timezone, except for the daily data which has a "day"
   * parameter in the format YYYY-MM-DD which is already in the user time zone. This is because the data is an aggregation
   * for that day that the user experienced.
   *
   * We pass the timezone to OpenMeteo so the day returned in format YYYY-MM-DD is in the user time zone
   * I'm not sure if this is technically correct, since they don´t consider DST it might actually be aggregation
   * of data from 1am to 1am or from 11pm to 11pm, but I'm not completely sure. And I don't really have another
   * way to get this data myself so that'll have to do it
   *
   * The following is a tale on OpenMeteo's DST problems and how I try to work around them here.
   * The TLDR is that they don't account for DST https://github.com/open-meteo/open-meteo/issues/488 in their responses.
   *
   * The lack of daylight savings information is pretty annoying to deal with. Especially when trying to accomodate daily
   * and hourly granularities in the same call. That is the reason why I chose to break it up in 2 API calls even though
   * it costs more of the quota.
   *
   * The strategy I use is:
   * For daily data, pass the user timezone: this means that the returned data should already be in the user time zone.
   * There's a chance that this information is off by 1 hour either way because of DST, but I'm not sure because it depends
   * on OpenMeteo's implementation. I have to take this approach because otherwise the only option to aggregate the
   * weather information for a given location is to aggregate the hourly information myself, but that would still lack
   * information (ie. sunrise and sunset). The only trick here is that I need to be careful how I convert sunrise and
   * sunset data to UTC since I need to use the utc_offset that was returned by OpenMeteo even though it's wrong to get
   * the UTC timestamp which I can then use Luxon to properly convert to the DST timestamp
   *
   * For hourly data: I completely disregard timezone at that point. I request data in unix time format. This means that
   * I can safely store that data and not have to worry about DST mistakes on their end. I can get away with this approach
   * because of the padding of days, otherwise I would be missing information in some cases (see github issue)
   *
   * @params.date in UTC
   * @params.point to fetch the location data for
   * @params.timezone the timezone of the location that is being requested
   *
   * @returns result the hourly and daily weather data for the point at the given time
   * @returns all weather information on that was retrieved. Might only contain the matched data if the result was cached
   */
  public async fetchHistorical(params: { point: Point; date: DateTime; timezone: string }): Promise<{
    match: {
      hour?: OpenMeteoHistoricalResponse["hourly"][number];
      day?: OpenMeteoHistoricalResponse["daily"][number];
    };
    all: {
      hourly: OpenMeteoHistoricalResponse["hourly"];
      daily: OpenMeteoHistoricalResponse["daily"];
    };
    wasCached: boolean;
  }> {
    try {
      const { timezoneDay: requestedDay, hour: requestedHour } = this.cache.findRequestedDate(
        params.date,
        params.timezone,
      );
      const { dailyResult: daily, wasCached: dailyWasCached } = await this.fetchDaily(params);
      const { hourlyResult: hourly, wasCached: hourlyWasCached } = await this.fetchHourly(params);

      const matchedDay = daily?.find((result) => result.day === requestedDay);
      const matchedHour = hourly?.find((result) => Math.abs(result.date.diff(requestedHour, "hour").hours) <= 0);
      return {
        match: {
          hour: matchedHour,
          day: matchedDay,
        },
        all: {
          hourly,
          daily,
        },
        wasCached: dailyWasCached || hourlyWasCached,
      };
    } catch (e) {
      console.log("OpenMeteoAPI error");
      console.log(e);
      throw e;
    }
  }

  public hourlyDataToDatabase(hourly: OpenMeteoHistoricalResponse["hourly"][number]): NewHourlyWeather {
    const result = {
      ...hourly,
      date: hourly.date.toJSDate(),
      createdAt: new Date(),
    } satisfies NewHourlyWeather;

    // Enforces that if new fields are addded to the api response, they must be passed down to the database
    // or explicitely ignored
    const typedResult: Exact<NewHourlyWeather, typeof result> = result;

    return typedResult;
  }

  public dailyDataToDatabase(daily: OpenMeteoHistoricalResponse["daily"][number]): NewDailyWeather {
    const result = {
      ...omit(daily, "day"),
      sunrise: daily.sunrise?.toJSDate(),
      sunset: daily.sunset?.toJSDate(),
      date: daily.day,
      createdAt: new Date(),
    } satisfies NewDailyWeather;

    // Enforces that if new fields are addded to the api response, they must be passed down to the database
    // or explicitely ignored
    const typedResult: Exact<NewDailyWeather, typeof result> = result;

    return typedResult;
  }

  private getApiDateRage(date: DateTime) {
    const startDate = date.startOf("day").minus({ days: this.pastDaysPadding });
    const endDate = date.startOf("day").plus({ days: this.futureDaysPadding });
    const startDay = startDate.toSQLDate();
    const endDay = endDate.toSQLDate();

    if (!startDay || !endDay) {
      throw new Error("Failed to convert dates to days");
    }

    return { startDay, endDay };
  }

  private async fetchHourly(params: { date: DateTime; point: Point; timezone: string }) {
    const { point, timezone, date } = params;
    const { startDay, endDay } = this.getApiDateRage(date);
    const query: OpenMeteoApiHourlyParams = {
      latitude: point.lat,
      longitude: point.lng,
      start_date: startDay,
      end_date: endDay,
      timeformat: "unixtime",
      hourly: openMeteoApiParams.hourly,
    };
    const queryWithApiVersion = {
      ...query,
      apiVersion: OpenMeteo.apiVersion,
    };
    const { hour: cacheEventAt } = this.cache.findRequestedDate(params.date, params.timezone);

    const cachedResult = await this.cache.get(queryWithApiVersion, { location: point, eventAt: cacheEventAt });

    if (cachedResult) {
      this.logger.debug("Skipping API call because of cache hit");
    }

    const hourlyRaw = cachedResult?.response
      ? cachedResult.response
      : await this.http.GET(`/${OpenMeteo.apiVersion}/archive`, {
          params: {
            query,
          },
        });
    const fetchedAt = DateTime.utc();

    const parsedHourly = z.parse(HourlySchema, hourlyRaw);
    if (!parsedHourly.data) {
      this.logger.warn("Failed to get data for weather", {
        query,
        result: parsedHourly,
      });
      return { hourlyResult: [], wasCached: false };
    }
    const hourly = parsedHourly.data.hourly;
    // We store the same api response for each day that was returned, this means that we'll have many cache entries
    // pointing to the same raw data. To avoid duplicated entries in S3, we store the first entry's S3 key and then
    // point all other dates to the same file
    let existingCacheS3Key: string | null = null;

    const hourlyResult: OpenMeteoHistoricalResponse["hourly"] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      // We can ignore the timezones altogether for this call. Because we pad 14 days before and after the requested
      // date, all of OpenMeteo's timezones problems aren't in play here. We'll get UTC times and that's what we store
      // When matching it to the user location we will find a match
      const date = DateTime.fromSeconds(hourly.time[i], { zone: "UTC" });
      if (!cachedResult) {
        const cacheEntry = await this.cache.set({
          request: queryWithApiVersion,
          response: existingCacheS3Key ? { existingS3Key: existingCacheS3Key } : { apiResponse: hourlyRaw },
          eventAt: date,
          location: point,
          fetchedAt,
        });
        existingCacheS3Key = cacheEntry?.s3Key ?? null;
      }
      hourlyResult.push({
        date,
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

    return { hourlyResult, wasCached: !!cachedResult };
  }

  private async fetchDaily(params: { date: DateTime; timezone: string; point: Point }) {
    const { date, timezone, point } = params;
    const { startDay, endDay } = this.getApiDateRage(date);
    const query: OpenMeteoApiDailyParams = {
      latitude: point.lat,
      longitude: point.lng,
      start_date: startDay,
      end_date: endDay,
      timezone,
      daily: openMeteoApiParams.daily,
    };
    const queryWithApiVersion = {
      ...query,
      apiVersion: OpenMeteo.apiVersion,
    };
    const { utcDay: cacheEventAt } = this.cache.findRequestedDate(params.date, params.timezone);

    const cachedResult = await this.cache.get(
      {
        ...query,
        apiVersion: OpenMeteo.apiVersion,
      },
      { location: point, eventAt: cacheEventAt },
    );

    if (cachedResult) {
      this.logger.debug("Skipping API call because of cache hit");
    } else {
      this.logger.debug("No cache hit");
    }

    const dailyRaw = cachedResult?.response
      ? cachedResult.response
      : await this.http.GET(`/${OpenMeteo.apiVersion}/archive`, {
          params: {
            query,
          },
        });
    const fetchedAt = DateTime.utc();
    const parsedDaily = z.parse(DailySchema, dailyRaw);
    if (!parsedDaily.data) {
      this.logger.warn("Failed to get data for weather", {
        query,
        result: parsedDaily,
      });
      return { dailyResult: [], wasCached: false };
    }
    const daily = parsedDaily.data.daily;
    // We store the same api response for each day that was returned, this means that we'll have many cache entries
    // pointing to the same raw data. To avoid duplicated entries in S3, we store the first entry's S3 key and then
    // point all other dates to the same file
    let existingCacheS3Key: string | null = null;

    const dailyResult: OpenMeteoHistoricalResponse["daily"] = [];
    for (let i = 0; i < daily.time.length; i++) {
      // We pass the timezone to OpenMeteo so the day returned in format YYYY-MM-DD is in the user time zone
      // I'm not sure if this is technically correct, since they don´t consider DST it might actually be aggregation
      // of data from 1am to 1am or from 11pm to 11pm, but I'm not completely sure. And I don't really have another
      // way to get this data myself so that'll have to do it
      const day = daily.time[i];

      if (!cachedResult) {
        const newCache = await this.cache.set({
          request: queryWithApiVersion,
          response: existingCacheS3Key ? { existingS3Key: existingCacheS3Key } : { apiResponse: dailyRaw },
          eventAt: DateTime.fromSQL(day, { zone: timezone }).startOf("day").toUTC(),
          location: point,
          fetchedAt,
        });
        existingCacheS3Key = newCache?.s3Key ?? null;
      }
      const sunrise = daily.sunrise[i];
      const sunset = daily.sunset[i];
      dailyResult.push({
        day,

        location: point,

        weatherCode: daily.weather_code[i],
        temperature2mMax: daily.temperature_2m_max[i],
        temperature2mMin: daily.temperature_2m_min[i],
        temperature2mMean: daily.temperature_2m_mean[i],
        apparentTemperatureMax: daily.apparent_temperature_max[i],
        apparentTemperatureMin: daily.apparent_temperature_min[i],
        // The result is in the user's timezone. To convert it to UTC we can't simply convert it because Open Meteo doesn't consider
        // day light savings. So you can see it as being in the user time zone, but not necessarily the hour that the user
        // experienced.
        // For example:
        // If my clock is -1h because of DST, OpenMeteo won´t consider that, so they might report that sunset was at
        // 7pm, but the time that I would've seen on the clock was 6pm. Luxon's DateTime is smart enough that if I converted
        // it would've expected 7pm to be the time that the user was experiecing so using it to convert to UTC
        // would yield wrong results.
        // So I use OpenMeteo's utc_offset_seconds parameter (which is technically the wrong offset) when parsing the ISO string
        // I can then convert that into UTC. So then when the frontend displays this now UTC date into the user's timezone
        // it'll properly display 6pm
        sunrise: sunrise
          ? DateTime.fromISO(sunrise, {
              zone: FixedOffsetZone.instance((parsedDaily.data.utc_offset_seconds ?? 0) / 60),
            }).toUTC()
          : null,
        sunset: sunset
          ? DateTime.fromISO(sunset, {
              zone: FixedOffsetZone.instance((parsedDaily.data.utc_offset_seconds ?? 0) / 60),
            }).toUTC()
          : null,

        daylightDuration: daily.daylight_duration[i],
        sunshineDuration: daily.sunshine_duration[i],
        rainSum: daily.rain_sum[i],
        snowfallSum: daily.snowfall_sum[i],
      });
    }

    return { dailyResult, wasCached: !!cachedResult };
  }
}

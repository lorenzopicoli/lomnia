import { z } from "zod";
import type { Point } from "../../db/types";
import { Logger } from "../Logger";
import type { paths } from "./gen/openMeteoOpenApiTypes";
import createClient from "openapi-fetch";
import { DateTime, FixedOffsetZone } from "luxon";
import { DailySchema, HourlySchema, openMeteoApiParams, type OpenMeteoHistoricalResponse } from "./OpenMeteoTypes";

/**
 * TODO: Add rate limiting in here
 */
export class OpenMeteo {
  static apiVersion = "v1" as const;
  private apiUrl = `https://archive-api.open-meteo.com`;
  protected logger = new Logger("OpenMeteoAPI");

  private apiDayPadding = 4;
  private http = createClient<paths>({ baseUrl: this.apiUrl });

  /**
   * Fetches historical weather data for a location based on a date.
   * In reality since it's the same cost (and because of timezone issues on OpenMeteo's side), we fetch data for
   * 14 days before and after the requested date. This ends up being pretty good since there's a good chance that
   * the user will be in the same area for the next 14 days (ie. their home).
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
   * @returns extra weather information on days before and after the requested time at the given point. This might
   * be null if the response for the request originated from the cache
   */
  public async fetchHistorical(params: { point: Point; date: DateTime; timezone: string }) {
    const { point, date, timezone } = params;

    const startDate = date.startOf("day").minus({ days: this.apiDayPadding });
    const endDate = date.startOf("day").plus({ days: this.apiDayPadding });
    const startDay = startDate.toSQLDate();
    const endDay = endDate.toSQLDate();

    if (!startDay || !endDay) {
      throw new Error("Failed to convert dates to days");
    }

    const daily = await this.fetchDaily({ start: startDay, end: endDay, timezone, point });
    const hourly = await this.fetchHourly({ start: startDay, end: endDay, timezone, point });

    const match = this.findMatchToRequestedDate(hourly, daily, { requestedDate: date, timezone });
    return {
      match,
      extra: {
        hourly,
        daily,
      },
      wasCached: false,
    };
  }

  private findMatchToRequestedDate(
    hourly: Awaited<ReturnType<typeof this.fetchHourly>>,
    daily: Awaited<ReturnType<typeof this.fetchDaily>>,
    params: {
      requestedDate: DateTime;
      timezone: string;
    },
  ) {
    const requestedDay = params.requestedDate.setZone(params.timezone).toSQLDate();
    const requestedHour = params.requestedDate.startOf("hour");

    const matchedDay = daily?.find((result) => result.day === requestedDay);
    const matchedHour = hourly?.find((result) => Math.abs(result.date.diff(requestedHour, "hour").hours) <= 0);

    return { hour: matchedHour, day: matchedDay };
  }

  private async fetchHourly(params: { start: string; end: string; point: Point; timezone: string }) {
    const { start, end, point, timezone } = params;
    const hourlyRaw = await this.http.GET(`/${OpenMeteo.apiVersion}/archive`, {
      params: {
        query: {
          latitude: point.lat,
          longitude: point.lng,
          start_date: start,
          end_date: end,
          timeformat: "unixtime",
          hourly: openMeteoApiParams.hourly,
        },
      },
    });

    const hourly = z.parse(HourlySchema, hourlyRaw.data?.hourly);

    const hourlyResult: OpenMeteoHistoricalResponse["hourly"] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      // We can ignore the timezones altogether for this call. Because we pad 14 days before and after the requested
      // date, all of OpenMeteo's timezones problems aren't in play here. We'll get UTC times and that's what we store
      // When matching it to the user location we will find a match
      const date = DateTime.fromSeconds(hourly.time[i], { zone: "UTC" });
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

    return hourlyResult;
  }

  private async fetchDaily(params: { start: string; end: string; timezone: string; point: Point }) {
    const { start, end, timezone, point } = params;
    const dailyRaw = await this.http.GET(`/${OpenMeteo.apiVersion}/archive`, {
      params: {
        query: {
          latitude: point.lat,
          longitude: point.lng,
          start_date: start,
          end_date: end,
          timezone,
          daily: openMeteoApiParams.daily,
        },
      },
    });

    if (!dailyRaw.data) {
      this.logger.error("Failed to get OpenMeteo Historical data", {
        latitude: point.lat,
        longitude: point.lng,
        timezone: timezone,
        start_date: start,
        end_date: end,
        daily: openMeteoApiParams.daily,
      });
      return null;
    }
    const daily = z.parse(DailySchema, dailyRaw.data.daily);
    const dailyResult: OpenMeteoHistoricalResponse["daily"] = [];
    for (let i = 0; i < daily.time.length; i++) {
      dailyResult.push({
        // We pass the timezone to OpenMeteo so the day returned in format YYYY-MM-DD is in the user time zone
        // I'm not sure if this is technically correct, since they don´t consider DST it might actually be aggregation
        // of data from 1am to 1am or from 11pm to 11pm, but I'm not completely sure. And I don't really have another
        // way to get this data myself so that'll have to do it
        day: daily.time[i],

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
        sunrise: DateTime.fromISO(daily.sunrise[i], {
          zone: FixedOffsetZone.instance((dailyRaw.data.utc_offset_seconds ?? 0) / 60),
        }).toUTC(),
        sunset: DateTime.fromISO(daily.sunset[i], {
          zone: FixedOffsetZone.instance((dailyRaw.data.utc_offset_seconds ?? 0) / 60),
        }).toUTC(),

        daylightDuration: daily.daylight_duration[i],
        sunshineDuration: daily.sunshine_duration[i],
        rainSum: daily.rain_sum[i],
        snowfallSum: daily.snowfall_sum[i],
      });
    }

    return dailyResult;
  }
}

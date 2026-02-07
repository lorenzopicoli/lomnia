import { isValid, parse } from "date-fns";
import { asc, count, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { dailyWeatherTable, type HourlyWeather, hourlyWeatherTable } from "../models";
import type { ChartPeriodInput, DateRange } from "../types/chartTypes";
import { getAggregatedXColumn } from "./common/getAggregatedXColumn";
import { getAggregatedYColumn } from "./common/getAggregatedYColumn";

export namespace WeatherService {
  export async function getByDay(params: { day: string }) {
    const { day } = params;
    if (!isValid(parse(day, "yyyy-MM-dd", new Date()))) {
      throw new Error("Invalid date");
    }
    const daily = await db.query.dailyWeatherTable.findFirst({
      where: sql`${dailyWeatherTable.date} = ${day}`,
    });

    return {
      daily,
    };
  }
  export async function list(params: DateRange) {
    const { start, end } = params;
    const hourly = await db.query.hourlyWeatherTable.findMany({
      where: sql`${hourlyWeatherTable.date} >= ${start.toISO()}
      AND ${hourlyWeatherTable.date} <= ${end.toISO()}`,
    });

    return hourly;
  }

  export function weatherCodeToText(code: number) {
    switch (code) {
      case 0:
        return "Clear sky";

      case 1:
        return "Mainly clear";
      case 2:
        return "Partly cloudy";
      case 3:
        return "Overcast";

      case 45:
      case 48:
        return "Fog";

      case 51:
        return "Light drizzle";
      case 53:
        return "Moderate drizzle";
      case 55:
        return "Dense drizzle";

      case 56:
        return "Light freezing drizzle";
      case 57:
        return "Dense freezing drizzle";

      case 61:
        return "Slight rain";
      case 63:
        return "Moderate rain";
      case 65:
        return "Heavy rain";

      case 66:
        return "Light freezing rain";
      case 67:
        return "Heavy freezing rain";

      case 71:
        return "Slight snowfall";
      case 73:
        return "Moderate snowfall";
      case 75:
        return "Heavy snowfall";

      case 77:
        return "Snow grains";

      case 80:
        return "Slight rain showers";
      case 81:
        return "Moderate rain showers";
      case 82:
        return "Violent rain showers";

      case 85:
        return "Slight snow showers";
      case 86:
        return "Heavy snow showers";

      case 95:
        return "Thunderstorm";

      case 96:
        return "Thunderstorm with slight hail";
      case 99:
        return "Thunderstorm with heavy hail";

      default:
        return "Unknown weather condition";
    }
  }

  export function formatWeatherDescription(weather: HourlyWeather): string {
    const parts: string[] = [];

    if (weather.temperature2m != null) {
      let tempPart = `${Math.round(weather.temperature2m)}°C`;

      if (weather.apparentTemperature != null && Math.abs(weather.apparentTemperature - weather.temperature2m) >= 2) {
        tempPart += ` (feels like ${Math.round(weather.apparentTemperature)}°C)`;
      }

      parts.push(tempPart);
    }

    if (weather.snowfall != null && weather.snowfall > 0) {
      parts.push(`${weather.snowfall.toFixed(1)} mm snow`);
    } else if (weather.rain != null && weather.rain > 0) {
      parts.push(`${weather.rain.toFixed(1)} mm rain`);
    } else if (weather.precipitation != null && weather.precipitation > 0) {
      parts.push(`${weather.precipitation.toFixed(1)} mm precipitation`);
    }

    if (weather.cloudCover != null) {
      if (weather.cloudCover < 20) parts.push("mostly clear");
      else if (weather.cloudCover < 50) parts.push("partly cloudy");
      else if (weather.cloudCover < 80) parts.push("cloudy");
      else parts.push("overcast");
    }

    if (weather.windSpeed10m != null && weather.windSpeed10m > 5) {
      parts.push(`wind ${Math.round(weather.windSpeed10m)} km/h`);
    }

    if (weather.relativeHumidity2m != null && weather.relativeHumidity2m >= 80) {
      parts.push(`humid (${Math.round(weather.relativeHumidity2m)}%)`);
    }

    if (weather.snowDepth != null && weather.snowDepth > 0) {
      parts.push(`${Math.round(weather.snowDepth)} cm snow on ground`);
    }

    if (parts.length === 0) {
      return "No weather data available";
    }

    return parts.join(", ");
  }
}

export namespace WeatherChartService {
  export const getDailyPrecipitation = async (params: ChartPeriodInput) => {
    const { aggregationPeriod, start, end } = params;
    const aggregatedDate = getAggregatedXColumn(dailyWeatherTable.date, aggregationPeriod);
    const data = db
      .select({
        rainSum: getAggregatedYColumn(dailyWeatherTable.rainSum, "max").mapWith(Number),
        snowfallSum: sql`${getAggregatedYColumn(dailyWeatherTable.snowfallSum, "max")} * 10`.mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(dailyWeatherTable)
      .where(
        sql`
      ${dailyWeatherTable.date} >= (${start.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${dailyWeatherTable.date} <= (${end.toISO()} AT TIME ZONE 'America/Toronto')::date`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export const getHourlyApparentVsActualTemp = async (params: ChartPeriodInput) => {
    const { aggregationPeriod, start, end } = params;
    const aggregatedDate = getAggregatedXColumn(hourlyWeatherTable.date, aggregationPeriod);
    const data = db
      .select({
        apparentTemp: getAggregatedYColumn(hourlyWeatherTable.apparentTemperature, "max").mapWith(Number),
        actualTemp: getAggregatedYColumn(hourlyWeatherTable.temperature2m, "max").mapWith(Number),
        date: aggregatedDate.mapWith(String),
      })
      .from(hourlyWeatherTable)
      .where(
        sql`
      ${hourlyWeatherTable.date} >= (${start.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${hourlyWeatherTable.date} <= (${end.toISO()} AT TIME ZONE 'America/Toronto')::date`,
      )
      .groupBy(aggregatedDate)
      .orderBy(asc(aggregatedDate));

    return data;
  };

  export async function getDailyCount() {
    return db
      .select({
        count: count(),
      })
      .from(dailyWeatherTable)
      .then((r) => r[0].count);
  }

  export async function getHourlyCount() {
    return db
      .select({
        count: count(),
      })
      .from(hourlyWeatherTable)
      .then((r) => r[0].count);
  }

  export async function getTotalCount() {
    const [daily, hourly] = await Promise.all([getDailyCount(), getHourlyCount()]);
    return daily + hourly;
  }
}

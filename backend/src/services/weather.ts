import { isValid, parse } from "date-fns";
import { asc, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { dailyWeatherTable, hourlyWeatherTable } from "../models";
import type { ChartPeriodInput } from "../types/chartTypes";
import { getAggregatedXColumn } from "./common/getAggregatedXColumn";
import { getAggregatedYColumn } from "./common/getAggregatedYColumn";

export namespace WeatherService {
  export async function getByDay(params: { day: string }) {
    const { day } = params;
    if (!isValid(parse(day, "yyyy-MM-dd", new Date()))) {
      throw new Error("Invalid date");
    }
    const hourly = await db.query.hourlyWeatherTable.findMany({
      where: sql`(${hourlyWeatherTable.date} AT TIME ZONE ${hourlyWeatherTable.timezone})::date = ${day}`,
      orderBy: hourlyWeatherTable.date,
    });
    const daily = await db.query.dailyWeatherTable.findFirst({
      where: sql`${dailyWeatherTable.date} = ${day}`,
    });

    return {
      hourly,
      daily,
    };
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
}

import { isValid, parse } from 'date-fns'
import { eq, sql, type getTableColumns } from 'drizzle-orm'
import type { DateTime } from 'luxon'
import { db } from '../db/connection'
import {
  dailyWeatherTable,
  hourlyWeatherTable,
  locationsTable,
  type HourlyWeatherColumns,
} from '../models'

export async function getWeatherInformation(params: { day: string }) {
  const { day } = params
  if (!isValid(parse(day, 'yyyy-MM-dd', new Date()))) {
    throw new Error('Invalid date')
  }
  const hourly = await db.query.hourlyWeatherTable.findMany({
    where: sql`(${hourlyWeatherTable.date} AT TIME ZONE ${hourlyWeatherTable.timezone})::date = ${day}`,
    orderBy: hourlyWeatherTable.date,
  })
  const daily = await db.query.dailyWeatherTable.findFirst({
    where: sql`${dailyWeatherTable.date} = ${day}`,
  })

  return {
    hourly,
    daily,
  }
}

export async function getWeatherAnalyticsLineCharts() {
  return [
    { key: 'apparentTemperature', description: 'Apparent Temperature' },
    { key: 'temperature2m', description: 'Temperature at 2 meters' },
    { key: 'snowfall', description: 'Snowfall' },
    { key: 'snowDepth', description: 'Snow Depth' },
    { key: 'windSpeed100m', description: 'Wind Speed at 100 meters' },
    { key: 'windSpeed10m', description: 'Wind Speed at 10 meters' },
    { key: 'relativeHumidity2m', description: 'Relative Humidity at 2 meters' },
    { key: 'precipitation', description: 'Precipitation' },
    { key: 'rain', description: 'Rain' },
    { key: 'weatherCode', description: 'Weather Code' },
    { key: 'cloudCover', description: 'Cloud Cover' },
  ] as { key: HourlyWeatherColumns; description: string }[]
}

export async function getWeatherAnalytics(params: {
  startDate: DateTime
  endDate: DateTime
}) {
  const grouppedLocations = db.$with('groupped_locations').as((cte) =>
    cte
      .select({
        hourlyWeatherId: sql`MAX(${locationsTable.hourlyWeatherId})`
          .mapWith(locationsTable.hourlyWeatherId)
          .as('hourly_weather_id'),
        date: sql`to_timestamp(floor((extract('epoch' from location_fix) / 3600 )) * 3600)`
          .mapWith(locationsTable.locationFix)
          .as('groupped_date'),
      })
      .from(locationsTable)
      .where(
        sql`
      ${locationsTable.locationFix} >= ${params.startDate.toISO()} 
      AND ${locationsTable.locationFix} <= ${params.endDate.toISO()}`
      )
      .groupBy(
        sql`to_timestamp(floor((extract('epoch' from location_fix) / 3600 )) * 3600)`
      )
  )

  const data = db
    .with(grouppedLocations)
    .select({
      date: grouppedLocations.date,
      entry: {
        temperature2m: hourlyWeatherTable.temperature2m,
        relativeHumidity2m: hourlyWeatherTable.relativeHumidity2m,
        apparentTemperature: hourlyWeatherTable.apparentTemperature,
        precipitation: hourlyWeatherTable.precipitation,
        rain: hourlyWeatherTable.rain,
        snowfall: hourlyWeatherTable.snowfall,
        snowDepth: hourlyWeatherTable.snowDepth,
        weatherCode: hourlyWeatherTable.weatherCode,
        cloudCover: hourlyWeatherTable.cloudCover,
        windSpeed10m: hourlyWeatherTable.windSpeed10m,
        windSpeed100m: hourlyWeatherTable.windSpeed100m,
      },
    })
    .from(grouppedLocations)
    .innerJoin(
      hourlyWeatherTable,
      eq(grouppedLocations.hourlyWeatherId, hourlyWeatherTable.id)
    )
    .orderBy(grouppedLocations.date)

  return data
}

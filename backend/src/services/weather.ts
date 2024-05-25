import { isValid, parse } from 'date-fns'
import { eq, sql } from 'drizzle-orm'
import type { DateTime } from 'luxon'
import { db } from '../db/connection'
import {
  dailyWeatherTable,
  hourlyWeatherTable,
  locationsTable,
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
      weather: hourlyWeatherTable,
    })
    .from(grouppedLocations)
    .innerJoin(
      hourlyWeatherTable,
      eq(grouppedLocations.hourlyWeatherId, hourlyWeatherTable.id)
    )
    .orderBy(grouppedLocations.date)

  return data
}

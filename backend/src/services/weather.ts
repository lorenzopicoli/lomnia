import { isValid, parse } from 'date-fns'
import { sql } from 'drizzle-orm'
import { db } from '../db/connection'
import { dailyWeatherTable, hourlyWeatherTable } from '../models'
import type { GetWeatherQueryParams } from '../routes/weather'

export async function getWeatherInformation(params: GetWeatherQueryParams) {
  const { date } = params
  if (!isValid(parse(date, 'yyyy-MM-dd', new Date()))) {
    throw new Error('Invalid date')
  }
  const hourly = await db.query.hourlyWeatherTable.findMany({
    where: sql`(${hourlyWeatherTable.date} AT TIME ZONE ${hourlyWeatherTable.timezone})::date = ${date}`,
    orderBy: hourlyWeatherTable.date,
  })
  const daily = await db.query.dailyWeatherTable.findFirst({
    where: sql`${dailyWeatherTable.date} = ${date}`,
  })

  return {
    hourly,
    daily,
  }
}

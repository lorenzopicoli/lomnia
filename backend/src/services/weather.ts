import { isValid, parse } from 'date-fns'
import { sql } from 'drizzle-orm'
import { db } from '../db/connection'
import { dailyWeatherTable, hourlyWeatherTable } from '../models'

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

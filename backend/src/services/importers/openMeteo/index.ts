import { daysToWeeks, format } from 'date-fns'
import { and, asc, desc, inArray, isNull, sql } from 'drizzle-orm'
import { fetchWeatherApi } from 'openmeteo'
import {
  type NewDailyWeather,
  type NewHourlyWeather,
  dailyWeatherTable,
  hourlyWeatherTable,
  locationsTable,
} from '../../../db/schema'
import type { DBTransaction, Point } from '../../../db/types'
import { BaseImporter } from '../BaseImporter'

import { chunk } from 'lodash'
import { DateTime } from 'luxon'
import { db } from '../../../db/connection'
import { delay } from '../../../helpers/delay'

export class OpenMeteoImport extends BaseImporter {
  override sourceId = 'openmeteo-v1'
  override destinationTable = 'weather'
  override entryDateKey = 'date'
  private importBatchSize = 50

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: Date
    totalEstimate?: number
  }> {
    return { result: true }
  }

  private getDateSteps(params: {
    startDateInUTC: DateTime
    endDateInUTC: DateTime
    step: { day?: number; hour?: number }
    timezone: string
  }) {
    const { startDateInUTC, endDateInUTC, step, timezone } = params
    console.log('Start and end date are', startDateInUTC, endDateInUTC)

    const goalEnd = endDateInUTC
    let currentDateTime = startDateInUTC
    const myRange: DateTime[] = []
    while (goalEnd.diff(currentDateTime, 'seconds').seconds > 0) {
      console.log(
        'Adding',
        currentDateTime,
        'which is equivalent to',
        currentDateTime.setZone(timezone)
      )
      myRange.push(currentDateTime)
      currentDateTime = currentDateTime.plus(step)
    }

    return myRange
  }

  private getLocationAndDate(tx: DBTransaction, offset: number) {
    const griddedPoints = tx.$with('locations_with_grid').as((cte) =>
      cte
        .select({
          grid: sql`ST_SnapToGrid(location::geometry, 0.01)`
            .mapWith(locationsTable.location)
            .as('grid'),
          accuracy: locationsTable.accuracy,
          dayString:
            sql`(${locationsTable.locationFix} AT TIME ZONE ${locationsTable.timezone})::date`
              .mapWith(String)
              .as('day_string'),
          timezone: locationsTable.timezone,
          id: locationsTable.id,
        })
        .from(locationsTable)
        .where(
          sql`
            (
                ${locationsTable.dailyWeatherId} IS NULL
                OR ${locationsTable.hourlyWeatherId} IS NULL
            )
           AND ${locationsTable.locationFix} < NOW() - INTERVAL '4 days'
        `
        )
    )

    return tx
      .with(griddedPoints)
      .select({
        location: griddedPoints.grid,
        dayString: griddedPoints.dayString,
        timezone: griddedPoints.timezone,
        // id: griddedPoints.id,
      })
      .from(griddedPoints)
      .groupBy(
        sql`${griddedPoints.grid}, ${griddedPoints.dayString}, ${griddedPoints.timezone}`
      )
      .orderBy(
        sql`${griddedPoints.dayString} ASC, ${griddedPoints.timezone} ASC, ${griddedPoints.grid} ASC`
      )
      .limit(this.importBatchSize)
    //   .offset(offset)
  }

  private async callApi(
    locations: Point[],
    startDayString: string,
    endDayString: string,
    timezone: string
  ): Promise<{ hourly: NewHourlyWeather[]; daily: NewDailyWeather[] }> {
    const range = (start: number, stop: number, step: number) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step)

    const hourlyResult: NewHourlyWeather[] = []
    const dailyResult: NewDailyWeather[] = []

    const url = 'https://archive-api.open-meteo.com/v1/archive'
    const st = DateTime.fromSQL(startDayString, {
      zone: 'UTC',
      outputCalendar: '',
      numberingSystem: '',
    })
    const et = DateTime.fromSQL(endDayString, {
      zone: 'UTC',
      outputCalendar: '',
      numberingSystem: '',
    })
    const meteoParams = {
      latitude: locations.map((p) => p.lat),
      longitude: locations.map((p) => p.lng),
      timezone: timezone,
      start_date: st.minus({ days: 1 }).toSQLDate(),
      end_date: et.plus({ days: 1 }).toSQLDate(),

      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'rain',
        'snowfall',
        'snow_depth',
        'weather_code',
        'cloud_cover',
        'wind_speed_10m',
        'wind_speed_100m',
      ],
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'daylight_duration',
        'sunshine_duration',
        'rain_sum',
        'snowfall_sum',
      ],
    }
    console.log('PARAMS', JSON.stringify(meteoParams))

    const responses = await fetchWeatherApi(url, meteoParams)

    // if (responses.length !== locations.length) {
    //   throw new Error(
    //     'Responses from OpenMeteo have a different length than the location date pairs'
    //   )
    // }
    // const hourlyStepsLookingFor = this.getDateSteps({
    //   // The hourly portion of the api response is interpreted in UTC
    //   // This makes it easier to handle timezones and daylight saving changes
    //   // I've found open meteo's api to not be very reliable for these.
    //   // So what I do here is I assume that they'll return 24 results even for
    //   // 25h or 23h days. So I completely ignore the timezone here and simply convert
    //   // it to utc and get steps of 1h in UTC
    //   startDateInUTC: DateTime.fromSQL(dayLookingFor, {
    //     zone: meteoParams.timezone,
    //     numberingSystem: '',
    //     outputCalendar: '',
    //   }).setZone('UTC'),
    //   endDateInUTC: DateTime.fromSQL(dayLookingFor, {
    //     zone: meteoParams.timezone,
    //     numberingSystem: '',
    //     outputCalendar: '',
    //   })
    //     .endOf('day', {})
    //     .setZone('UTC'),
    //   step: { hour: 1 },
    //   timezone: 'UTC',
    // })

    // const dailyStepsLookingFor = this.getDateSteps({
    //   // The daily portion of the response is as experienced from a given timezone.
    //   // So the value we pass to the step creation function are in the user's timezone
    //   // This is because 2024-01-10 23:00 EST is 2024-01-11 UTC. In this case we don't want
    //   // to store 2024-01-11 in the DB, we want 2024-01-10
    //   startDateInUTC: DateTime.fromSQL(dayString, {
    //     zone: meteoParams.timezone,
    //     numberingSystem: '',
    //     outputCalendar: '',
    //   }).startOf('day', {}),
    //   //   .setZone(timezone),
    //   endDateInUTC: DateTime.fromSQL(dayString, {
    //     zone: meteoParams.timezone,
    //     numberingSystem: '',
    //     outputCalendar: '',
    //   }).endOf('day', {}),
    //   //   .setZone(timezone),
    //   step: { day: 1 },
    //   timezone: meteoParams.timezone,
    // })

    for (let i = 0; i < locations.length; i++) {
      const responseForPair = responses[i]
      const utcOffsetSeconds = responseForPair.utcOffsetSeconds()
      const hourly = responseForPair.hourly()
      const daily = responseForPair.daily()

      if (!hourly) {
        throw new Error(`Missing hourly ${JSON.stringify(locations[i])}`)
      }
      if (!daily) {
        throw new Error(`Missing daily ${JSON.stringify(locations[i])}`)
      }

      //   if (hourlySteps.length !== hourly.variables(0)?.valuesLength()) {
      //     console.log('Dates', hourlySteps)
      //     console.log('Vars', hourly.variables(0)?.valuesArray())
      //     throw new Error(
      //       `Discrepancy in hourly steps length and variables length ${
      //         hourlySteps.length
      //       } ${hourly.variables(0)?.valuesLength()}`
      //     )
      //   }

      const responseIntendedHours = range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval()
      ).map((t) => new Date(t * 1000))

      const temperature2m = hourly.variables(0)?.valuesArray() ?? []
      const relativeHumidity2m = hourly.variables(1)?.valuesArray() ?? []
      const apparentTemperature = hourly.variables(2)?.valuesArray() ?? []
      const precipitation = hourly.variables(3)?.valuesArray() ?? []
      const rain = hourly.variables(4)?.valuesArray() ?? []
      const snowfall = hourly.variables(5)?.valuesArray() ?? []
      const snowDepth = hourly.variables(6)?.valuesArray() ?? []
      const weatherCode = hourly.variables(7)?.valuesArray() ?? []
      const cloudCover = hourly.variables(8)?.valuesArray() ?? []
      const windSpeed10m = hourly.variables(9)?.valuesArray() ?? []
      const windSpeed100m = hourly.variables(10)?.valuesArray() ?? []
      for (let j = 0; j < responseIntendedHours.length; j++) {
        const intendedHour = responseIntendedHours[j]
        // const match = hourlyStepsLookingFor.find(
        //   (lookingFor) =>
        //     DateTime.fromJSDate(intendedHour).diff(lookingFor, 'minute')
        //       .minutes === 0
        // )
        // if (match) {
        //   console.log(
        //     'I think that, the resopnse hour',
        //     intendedHour,
        //     "matches the hour I'm looking for",
        //     match
        //   )
        // } else {
        //   console.log(
        //     'I think that, the resopnse hour',
        //     intendedHour,
        //     'doesnt match any of the hours Im looking for'
        //   )
        // }
        hourlyResult.push({
          importJobId: 1,
          date: intendedHour,
          //Weird calculation
          //   date: hourDate,

          timezone: meteoParams.timezone,

          temperature2m: temperature2m[j],
          relativeHumidity2m: relativeHumidity2m[j],
          apparentTemperature: apparentTemperature[j],
          precipitation: precipitation[j],
          rain: rain[j],
          snowfall: snowfall[j],
          snowDepth: snowDepth[j],
          weatherCode: weatherCode[j],
          cloudCover: cloudCover[j],
          windSpeed10m: windSpeed10m[j],
          windSpeed100m: windSpeed100m[j],

          location: locations[i],

          createdAt: new Date(),
        })
      }

      //   console.log(
      //     'The DAILY steps are',
      //     meteoParams.timezone,
      //     dailySteps.map((s) => s)
      //   )
      //   console.log(
      //     'The HOURLY steps are',
      //     meteoParams.timezone,
      //     hourlySteps.map((s) => s),
      //     'THe intended start/end',
      //     new Date(Number(hourly.time()) * 1000),
      //     new Date(Number(hourly.timeEnd()) * 1000)
      //   )

      //   if (hourlySteps) {
      //     throw new Error('test')
      //   }
      const responseIntendedDays = range(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000))
      //   if (dailySteps.length !== daily.variables(0)?.valuesLength()) {
      //     throw new Error(
      //       `Discrepancy in daily steps length and variables length ${
      //         dailySteps.length
      //       } ${daily.variables(0)?.valuesLength()}`
      //     )
      //   }
      const dailyWeatherCode = daily.variables(0)?.valuesArray() ?? []
      const dailyTemperature2mMax = daily.variables(1)?.valuesArray() ?? []
      const dailyTemperature2mMin = daily.variables(2)?.valuesArray() ?? []
      const dailyTemperature2mMean = daily.variables(3)?.valuesArray() ?? []
      const dailyApparentTemperatureMax =
        daily.variables(4)?.valuesArray() ?? []
      const dailyApparentTemperatureMin =
        daily.variables(5)?.valuesArray() ?? []
      const dailySunrise = daily.variables(6)
      const dailySunset = daily.variables(7)
      const dailyDaylightDuration = daily.variables(8)?.valuesArray() ?? []
      const dailySunshineDuration = daily.variables(9)?.valuesArray() ?? []
      const dailyRainSum = daily.variables(10)?.valuesArray() ?? []
      const dailySnowfallSum = daily.variables(11)?.valuesArray() ?? []
      for (let j = 0; j < responseIntendedDays.length; j++) {
        dailyResult.push({
          importJobId: 1,
          date: DateTime.fromJSDate(responseIntendedDays[j], {
            zone: 'UTC',
          }).toSQLDate(),
          // .toUTC()
          // .toSQLDate(),

          weatherCode: dailyWeatherCode[j],
          temperature2mMax: dailyTemperature2mMax[j],
          temperature2mMin: dailyTemperature2mMin[j],
          temperature2mMean: dailyTemperature2mMean[j],
          apparentTemperatureMax: dailyApparentTemperatureMax[j],
          apparentTemperatureMin: dailyApparentTemperatureMin[j],
          sunrise: new Date(
            (Number(dailySunrise?.valuesInt64(j)) + utcOffsetSeconds) * 1000
          ),
          sunset: new Date(
            (Number(dailySunset?.valuesInt64(j)) + utcOffsetSeconds) * 1000
          ),

          daylightDuration: dailyDaylightDuration[j],
          sunshineDuration: dailySunshineDuration[j],
          rainSum: dailyRainSum[j],
          snowfallSum: dailySnowfallSum[j],
          location: locations[i],

          createdAt: new Date(),
        })
      }
      // console.log('I was looking for entries on the date of (EST):', dayString)
      //   console.log(
      //     'For that I called the API with (EST) for the following days:',
      //     meteoParams.start_date,
      //     meteoParams.end_date
      //   )
      //   console.log('From that I got hourly entries:')
      //   hourlyResult.map((h) => {
      //     console.log('JS Date', h.date)
      //     console.log('DateTime.fromISO', DateTime.fromISO(h.date.toISOString()))
      //     console.log(
      //       'DateTime.fromISO set zone',
      //       DateTime.fromISO(h.date.toISOString()).setZone(meteoParams.timezone)
      //     )
      //   })
      //   console.log('From that I got daily entries:')
      //   dailyResult.map((h) => {
      //     console.log('JS Date', h.date)
      //     console.log('DateTime.fromISO', DateTime.fromSQL(h.date))
      //     console.log(
      //       'DateTime.fromISO set zone',
      //       DateTime.fromISO(h.date).setZone(meteoParams.timezone)
      //     )
      //   })

      //   if (dailyResult) {
      //     throw new Error('aaa')
      //   }
    }

    return { daily: dailyResult, hourly: hourlyResult }
  }

  private async linkLocationsToWeatherData(
    tx: DBTransaction,
    // in UTC
    startDate?: DateTime,
    // in UTC
    endDate?: DateTime
  ) {
    await tx.update(locationsTable).set({
      hourlyWeatherId: sql`(
        SELECT id
        FROM hourly_weather
        WHERE hourly_weather.location = ST_SnapToGrid(${locationsTable.location}::geometry, 0.01)
        AND ${locationsTable.locationFix} >= hourly_weather.date
        AND ${locationsTable.locationFix} < hourly_weather.date + interval '1 hour'
        LIMIT 1
        )`,
    }).where(sql`
      ${locationsTable.hourlyWeatherId} IS NULL
            ${
              startDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date >= (${startDate.toISO()}::timestamp - interval '2 days')::date`
                : sql``
            }
            ${
              endDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date <= (${endDate.toISO()}::timestamp + interval '2 days')::date`
                : sql``
            }
      `)
    await tx.update(locationsTable).set({
      dailyWeatherId: sql`(
        SELECT id
        FROM daily_weather
        WHERE daily_weather.location = ST_SnapToGrid(${locationsTable.location}::geometry, 0.01)
        AND (${locationsTable.locationFix} AT TIME ZONE locations.timezone)::date = daily_weather.date
        LIMIT 1
        )`,
    }).where(sql`
      ${locationsTable.dailyWeatherId} IS NULL
            ${
              startDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date >= (${startDate.toISO()}::timestamp - interval '2 days')::date`
                : sql``
            }
            ${
              endDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date <= (${endDate.toISO()}::timestamp + interval '2 days')::date`
                : sql``
            }
      `)

    await tx.delete(dailyWeatherTable).where(sql`
        ${dailyWeatherTable.id} NOT IN (select ${locationsTable.dailyWeatherId} from locations where ${locationsTable.dailyWeatherId} IS NOT NULL)
      `)
    await tx.delete(hourlyWeatherTable).where(sql`
        ${hourlyWeatherTable.id} NOT IN (select ${locationsTable.hourlyWeatherId} from locations where ${locationsTable.hourlyWeatherId} IS NOT NULL)
      `)
  }

  private findEarliestAndLatest(
    pairs: { location: Point; dayString: string; timezone: string }[],
    currentFirst: DateTime | undefined,
    currentLast: DateTime | undefined
  ) {
    const result = { first: currentFirst, last: currentFirst }
    const firstDt = DateTime.fromSQL(pairs[0].dayString)
      .setZone(pairs[0].timezone, { keepLocalTime: true })
      .toUTC()
    if (!currentFirst || currentFirst.diff(firstDt).milliseconds > 0) {
      result.first = firstDt
    }

    const lastDt = DateTime.fromSQL(pairs[pairs.length - 1].dayString)
      .setZone(pairs[pairs.length - 1].timezone, {
        keepLocalTime: true,
      })
      .toUTC()
    if (!currentLast || currentLast.diff(lastDt).milliseconds < 0) {
      result.last = lastDt
    }

    return result
  }

  public async import(params: {
    tx: DBTransaction
    placeholderJobId: number
  }): Promise<{
    importedCount: number
    firstEntryDate: Date
    lastEntryDate: Date
    logs: string[]
  }> {
    let locationDatePairs:
      | { location: Point; dayString: string; timezone: string }[]
      | undefined

    let currentOffset = 0
    let importedCount = 0
    const apiLimitPerDay = 10_000
    const secondsInDay = 24 * 60 * 60

    let firstDate: DateTime | undefined
    let lastDate: DateTime | undefined

    let apiCallsCount = 0
    // console.log('Initial link call')
    // await this.linkLocationsToWeatherData(params.tx)

    // Calculates how fast we're fetching the api. To avoid going over the rate limit
    const calculateSpeed = () =>
      apiCallsCount /
      (DateTime.now().diff(this.jobStart, 'seconds').seconds || 1)

    // Capping the import count to 2000 so it doesn't hang for too long on a single run
    while (locationDatePairs?.length !== 0) {
      locationDatePairs = await this.getLocationAndDate(
        params.tx,
        currentOffset
      )
      //   console.log('point', locationDatePairs)
      //   if (calculateSpeed) {
      //     throw new Error('test')
      //   }
      currentOffset += this.importBatchSize

      if (locationDatePairs.length === 0) {
        break
      }

      const firstAndLatest = this.findEarliestAndLatest(
        locationDatePairs,
        firstDate,
        lastDate
      )
      firstDate = firstAndLatest.first
      lastDate = firstAndLatest.last

      // Group by timezone since API needs one timezone per call
      const byTimezone: Record<string, typeof locationDatePairs> =
        locationDatePairs.reduce((acc, curr) => {
          acc[curr.timezone] = [...(acc[curr.timezone] ?? []), curr]
          return acc
        }, {})

      // Calling API for days 2024-02-19 - 2024-02-27 and timezone America/Toronto
      for (const timezone of Object.keys(byTimezone)) {
        const sameTimezonePairs = byTimezone[timezone]
        const earliestDay = sameTimezonePairs[0].dayString
        const latestDay =
          sameTimezonePairs[sameTimezonePairs.length - 1].dayString

        // Group by days since the api will return data for every day for every point. We only want to store
        // weather information for locations and days where we have data for.
        // Example:
        // Point A on 2024-01-01
        // Point B on 2024-02-02
        // API will reply with 2024-02-01 at Point A and Point B
        //
        // This approach increases the amount of API calls, but it's easier to implement right now.
        // const byDay: Record<string, typeof locationDatePairs> =
        //   sameTimezonePairs.reduce((acc, curr) => {
        //     acc[curr.dayString] = [...(acc[curr.dayString] ?? []), curr]
        //     return acc
        //   }, {})

        // for (const day of Object.keys(byDay)) {
        console.log('Waiting before calling again based on speed')
        await delay(10000)
        // while (calculateSpeed() > apiLimitPerDay / secondsInDay) {
        //   await delay(1000)
        // }
        console.log(
          `Calling API for days ${earliestDay} - ${latestDay} and timezone ${timezone}`
        )
        apiCallsCount += 1
        const result = await this.callApi(
          sameTimezonePairs.map((l) => l.location),
          earliestDay,
          latestDay,
          timezone
        )

        const hourlyChunks = chunk(result.hourly, 200)
        for (const chunk of hourlyChunks) {
          await params.tx
            .insert(hourlyWeatherTable)
            .values(chunk)
            .onConflictDoNothing()
        }
        const dailyChunks = chunk(result.daily, 200)
        for (const chunk of dailyChunks) {
          await params.tx
            .insert(dailyWeatherTable)
            .values(chunk)
            .onConflictDoNothing()
        }
        console.log(
          'Linking locations to weather info. This might take a while if there are a lot of loactions missing weather information'
        )
        importedCount += result.daily.length + result.hourly.length
        console.log(`Already imported ${importedCount} rows`)
        //   await params.tx.insert(hourlyWeatherTable).values(result.hourly)
        // }
      }
      // Link, but only based on the dates that we have seen already. This could be better since this will only increase
      // as we go. But in the function we also check for null daily_weather_id and hourly_weather_id so hopefuly it doesn't
      // make a big impact. This is just a workaround for now
      await this.linkLocationsToWeatherData(
        params.tx,
        firstAndLatest.first,
        firstAndLatest.last
      )

      //   const errs = await params.tx.query.locationsTable.findMany({
      //     where: sql`(${locationsTable.hourlyWeatherId} IS NULL AND ${locationsTable.dailyWeatherId} IS NOT NULL)
      //     OR (${locationsTable.hourlyWeatherId} IS NOT NULL AND ${locationsTable.dailyWeatherId} IS NULL)`,
      //   })

      //   if (errs.length > 0) {
      // console.log('FOUND PROBLEMS', errs)
      // throw new Error('')
      //   }
    }

    console.log('Final link call')
    await this.linkLocationsToWeatherData(params.tx)
    console.log('Done importing weather information')
    return {
      importedCount,
      lastEntryDate: lastDate?.toJSDate() ?? this.placeholderDate,
      firstEntryDate: firstDate?.toJSDate() ?? this.placeholderDate,
      logs: [],
    }
  }
}

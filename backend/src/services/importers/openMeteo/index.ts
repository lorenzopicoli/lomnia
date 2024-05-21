import { isNull, or, sql } from 'drizzle-orm'
import { fetchWeatherApi } from 'openmeteo'
import type { DBTransaction, Point } from '../../../db/types'
import { BaseImporter } from '../BaseImporter'

import { chunk } from 'lodash'
import { DateTime } from 'luxon'
import { db } from '../../../db/connection'
import { delay } from '../../../helpers/delay'
import { locationsTable } from '../../../models/Location'
import {
  type NewDailyWeather,
  type NewHourlyWeather,
  dailyWeatherTable,
  hourlyWeatherTable,
} from '../../../models/Weather'

export class OpenMeteoImport extends BaseImporter {
  override sourceId = 'openmeteo-v1'
  override destinationTable = 'daily_weather/hourly_weather'
  override entryDateKey = 'date'
  // Need to keep this somewhat low to avoid query params limits
  // Can improve performance by increasing this and then chunking the requests
  // since the main query is somewhat slow to run
  private importBatchSize = 50

  // Needs to be a valid postgres interval
  private dataAvailabilityDelay = '4 days'

  // Defines how precise or close to each other the points are. The lower the number, the more api calls we'll
  // do and the more granularity we'll have.
  // Keep in mind that the weather models usually have a bigger area than this already so there shouldn't be
  // any need to change this
  // I also believe that changing this would trigger a refetch of effectively all the locations in the database
  // since the location/date pairs wouldn't match the exisiting weather entries anymore
  private gridPrecision = '0.01'

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: Date
    totalEstimate?: number
  }> {
    const count = await db
      .select({
        count: sql`COUNT(id)`.mapWith(Number),
      })
      .from(locationsTable).where(sql`
        (
        ${locationsTable.dailyWeatherId} IS NULL
        OR ${locationsTable.dailyWeatherId} IS NULL
        )
        AND
        ${locationsTable.locationFix} < NOW() - INTERVAL '${sql.raw(
      this.dataAvailabilityDelay
    )}'
    `)

    const value = count[0].count ?? 0
    return { result: value > 0, totalEstimate: value }
  }

  /**
   * Fetches a list of location, date and timezones.
   * Locations are grid positions that encapsulates all the nearby location entries
   * Date (day_string) are dates in the format 'YYYY-MM-DD'. They are in the user timezone
   */
  private getLocationAndDate(tx: DBTransaction) {
    const griddedPoints = tx.$with('locations_with_grid').as((cte) =>
      cte
        .select({
          grid: sql`ST_SnapToGrid(location::geometry, ${sql.raw(
            this.gridPrecision
          )})`
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
            ${locationsTable.locationFix} < NOW() - INTERVAL '${sql.raw(
            this.dataAvailabilityDelay
          )}'
        `
        )
    )

    return (
      tx
        .with(griddedPoints)
        .select({
          location: griddedPoints.grid,
          dayString: griddedPoints.dayString,
          timezone: griddedPoints.timezone,
        })
        .from(griddedPoints)
        .groupBy(
          sql`${griddedPoints.grid}, ${griddedPoints.dayString}, ${griddedPoints.timezone}`
        )
        // Careful changing this since other functions make assumptions about the ordering
        .orderBy(
          sql`${griddedPoints.dayString} ASC, ${griddedPoints.timezone} ASC, ${griddedPoints.grid} ASC`
        )
        .limit(this.importBatchSize)
    )
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

    if (responses.length !== locations.length) {
      throw new Error(
        'Responses from OpenMeteo have a different length than the location date pairs'
      )
    }

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

      const responseIntendedHours = range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval()
      ).map((t) => new Date(t * 1000))

      if (hourlySteps.length !== hourly.variables(0)?.valuesLength()) {
        throw new Error(
          `Discrepancy in hourly steps length and variables length ${
            hourlySteps.length
          } ${hourly.variables(0)?.valuesLength()}`
        )
      }

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
        hourlyResult.push({
          importJobId: 1,
          date: intendedHour,

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

      const responseIntendedDays = range(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000))
      if (dailySteps.length !== daily.variables(0)?.valuesLength()) {
        throw new Error(
          `Discrepancy in daily steps length and variables length ${
            dailySteps.length
          } ${daily.variables(0)?.valuesLength()}`
        )
      }
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
          sunrise: new Date(Number(dailySunrise?.valuesInt64(j)) * 1000),
          sunset: new Date(Number(dailySunset?.valuesInt64(j)) * 1000),

          daylightDuration: dailyDaylightDuration[j],
          sunshineDuration: dailySunshineDuration[j],
          rainSum: dailyRainSum[j],
          snowfallSum: dailySnowfallSum[j],
          location: locations[i],

          createdAt: new Date(),
        })
      }
    }

    return { daily: dailyResult, hourly: hourlyResult }
  }

  /**
   * This function will look for all weather information that links up to locations in the database
   * and properly link them up.
   * It lives in this importer since there's currently no other weather importers, but it could be made
   * reusable in the future.
   *
   * To find matches we have to find location/date pairs between the locations table and the weather table
   * Since this is a very costy operation this function takes optionally two arguments to bound
   * the update between two dates. These two dates are not important for any operation other than
   * helping narrow down the update. Because of the stated and the fact that I've had bugs around this
   * it adds a "buffer" on the interval
   *
   * This is a good place to start improving the performance of this importer
   */
  private async linkLocationsToWeather(
    tx: DBTransaction,
    /**
     * In UTC
     */
    startDate?: DateTime,
    /**
     * In UTC
     */
    endDate?: DateTime
  ) {
    const buffer = '2 days'

    await tx.update(locationsTable).set({
      hourlyWeatherId: sql`(
        SELECT id
        FROM hourly_weather
        WHERE hourly_weather.location = ST_SnapToGrid(${
          locationsTable.location
        }::geometry, ${sql.raw(this.gridPrecision)})
        AND ${locationsTable.locationFix} >= hourly_weather.date
        AND ${
          locationsTable.locationFix
        } < hourly_weather.date + interval '1 hour'
        LIMIT 1
        )`,
    }).where(sql`
      ${locationsTable.hourlyWeatherId} IS NULL
            ${
              startDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date >= (${startDate.toISO()}::timestamp - interval '${sql.raw(
                    buffer
                  )}')::date`
                : sql``
            }
            ${
              endDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date <= (${endDate.toISO()}::timestamp + interval '${sql.raw(
                    buffer
                  )}')::date`
                : sql``
            }
      `)
    await tx.update(locationsTable).set({
      dailyWeatherId: sql`(
        SELECT id
        FROM daily_weather
        WHERE daily_weather.location = ST_SnapToGrid(${
          locationsTable.location
        }::geometry, ${sql.raw(this.gridPrecision)})
        AND (${
          locationsTable.locationFix
        } AT TIME ZONE locations.timezone)::date = daily_weather.date
        LIMIT 1
        )`,
    }).where(sql`
      ${locationsTable.dailyWeatherId} IS NULL
            ${
              startDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date >= (${startDate.toISO()}::timestamp - interval '${sql.raw(
                    buffer
                  )}')::date`
                : sql``
            }
            ${
              endDate
                ? sql`AND ${
                    locationsTable.locationFix
                  }::date <= (${endDate.toISO()}::timestamp + interval '${sql.raw(
                    buffer
                  )}')::date`
                : sql``
            }
      `)
  }

  /**
   * Because of the way that OpenMeteo (fails) to handle daylight savings I've decided to add 2 days of padding
   * to every API call. This means we end up with a lot of entries that are useless. It's simpler to just add
   * them all to the database and then delete the dangling ones after we've linked all of them.
   * It's definitely not very resource efficient, but it does the job.
   * This functions cleans up the DB
   */
  private async cleanUpDanglingWeatherEntries(tx: DBTransaction) {
    await tx.delete(dailyWeatherTable).where(sql`
        ${dailyWeatherTable.id} NOT IN (select ${locationsTable.dailyWeatherId} from locations where ${locationsTable.dailyWeatherId} IS NOT NULL)
      `)
    await tx.delete(hourlyWeatherTable).where(sql`
        ${hourlyWeatherTable.id} NOT IN (select ${locationsTable.hourlyWeatherId} from locations where ${locationsTable.hourlyWeatherId} IS NOT NULL)
      `)
  }

  /**
   * This function assumes that the pairs array is sorted from earliest to latest
   */
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

    let firstDate: DateTime | undefined
    let lastDate: DateTime | undefined

    let apiCallsCount = 0
    // console.log('Initial link call')
    // await this.linkLocationsToWeatherData(params.tx)

    // Capping the import count to 2000 so it doesn't hang for too long on a single run
    while (locationDatePairs?.length !== 0) {
      locationDatePairs = await this.getLocationAndDate(params.tx)
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
      await this.linkLocationsToWeather(
        params.tx,
        firstAndLatest.first,
        firstAndLatest.last
      )

      await this.cleanUpDanglingWeatherEntries(params.tx)

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
    await this.linkLocationsToWeather(params.tx)
    await this.cleanUpDanglingWeatherEntries(params.tx)
    console.log('Done importing weather information')
    return {
      importedCount,
      lastEntryDate: lastDate?.toJSDate() ?? this.placeholderDate,
      firstEntryDate: firstDate?.toJSDate() ?? this.placeholderDate,
      logs: [],
    }
  }
}

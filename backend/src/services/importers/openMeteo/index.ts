import { sql } from 'drizzle-orm'
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
  override apiVersion = 'https://archive-api.open-meteo.com/v1/archive'
  override destinationTable = 'daily_weather/hourly_weather'
  override entryDateKey = 'date'
  // Need to keep this somewhat low to avoid query params limits
  // Can improve performance by increasing this and then chunking the requests
  // since the main query is somewhat slow to run
  private importBatchSize = 50

  // Needs to be a valid postgres interval
  // The API seems to have a delay of 2 days
  // Since we add a padding of 1 day to the API call (so if we're fetching for the 8th, we call from 7th to 9th)
  // because of daylight saving issues, this number - apiDayPadding should be >= 3
  private dataAvailabilityDelay = '4 days'

  // Calls OpenMeteos API for the dates we want to get data for +- this padding
  // This padding is because of issues of daylight savings in OpenMeteo's side
  // https://github.com/open-meteo/open-meteo/issues/488
  private apiDayPadding = 1

  // Defines how precise or close to each other the points are. The lower the number, the more api calls we'll
  // do and the more granularity we'll have.
  // Keep in mind that the weather models usually have a bigger area than this already so there shouldn't be
  // any need to change this
  // I also believe that changing this would trigger a refetch of effectively all the locations in the database
  // since the location/date pairs wouldn't match the exisiting weather entries anymore
  private gridPrecision = '0.01'

  // This should be better calculated so this importer can run as fast as possible. In reality I couldn't find
  // any proper documentation on their API rate limits. On the website it says fewer than 10k calls per day,
  // but I know there are also daily/minute rates. I found a PR with some description and that's what I used
  // to very roughly calculate a number that would be very safe (I rather it to be slow than failing consistently)
  // In ms
  private apiCallsDelay = 10000

  private maxImportSession = 1000

  private apiUrl = 'https://archive-api.open-meteo.com/v1/archive'
  private apiParams = {
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
        OR ${locationsTable.hourlyWeatherId} IS NULL
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
            AND
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

  /**
   *
   * @param start Unix timestamp in seconds
   * @param stop Unix timestamp in seconds
   * @param step In seconds
   */
  private generateDatesFromRange(
    start: number,
    stop: number,
    step: number,
    utcOffsetInSeconds?: number
  ) {
    return Array.from(
      { length: (stop - start) / step },
      (_, i) => start + i * step
    ).map((r) => new Date((r + (utcOffsetInSeconds ?? 0)) * 1000))
  }

  private async callApi(
    locations: Point[],
    startDayString: string,
    endDayString: string,
    timezone: string
  ): Promise<{ hourly: NewHourlyWeather[]; daily: NewDailyWeather[] }> {
    const hourlyResult: NewHourlyWeather[] = []
    const dailyResult: NewDailyWeather[] = []

    const paddedStartDate = DateTime.fromSQL(startDayString, {
      // The startDayString comes from the DB in the correct timezone already (following
      // the "timezone" parameter). So here we set UTC to stop Luxon from making any time
      // conversions here
      zone: 'UTC',
      outputCalendar: '',
      numberingSystem: '',
    })
      .minus({ days: this.apiDayPadding })
      .toSQLDate()

    const paddedEndDate = DateTime.fromSQL(endDayString, {
      // The endDayString comes from the DB in the correct timezone already (following
      // the "timezone" parameter). So here we set UTC to stop Luxon from making any time
      // conversions here
      zone: 'UTC',
      outputCalendar: '',
      numberingSystem: '',
    })
      .plus({ days: this.apiDayPadding })
      .toSQLDate()

    const meteoParams = {
      latitude: locations.map((p) => p.lat),
      longitude: locations.map((p) => p.lng),
      timezone: timezone,
      start_date: paddedStartDate,
      end_date: paddedEndDate,
      ...this.apiParams,
    }

    console.log(
      'Calling OpenMeteo with the following parameters',
      JSON.stringify(meteoParams)
    )

    const responses = await fetchWeatherApi(this.apiUrl, meteoParams)

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

      // Notice no UTC offset is passed so the generated dates are in UTC
      const hourlyDates = this.generateDatesFromRange(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval()
      )

      if (hourlyDates.length !== hourly.variables(0)?.valuesLength()) {
        throw new Error(
          `Discrepancy in hourly steps length and variables length ${
            hourlyDates.length
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
      for (let j = 0; j < hourlyDates.length; j++) {
        hourlyResult.push({
          importJobId: 1,
          date: hourlyDates[j],

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

      // We pass the UTC offset to the function so when we convert the date back to string we get the right date
      // in the "timezone"
      const dailyHours = this.generateDatesFromRange(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval(),
        utcOffsetSeconds
      )

      if (dailyHours.length !== daily.variables(0)?.valuesLength()) {
        throw new Error(
          `Discrepancy in daily steps length and variables length ${
            dailyHours.length
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
      for (let j = 0; j < dailyHours.length; j++) {
        dailyResult.push({
          importJobId: 1,
          date:
            DateTime.fromJSDate(dailyHours[j], {
              // Pass UTC here since the JS Date object already accounts from the utcOffset in the call to this.generateDatesFromRange
              // I've tried converting to the timezone here, but the problem is that open meteo doesn't handle daylight savings too well
              // so it's easier to save in the database whatever open meteo INTENDED for the time to be rather than making assumptions here
              zone: 'UTC',
            }).toSQLDate() ?? '',

          weatherCode: dailyWeatherCode[j],
          temperature2mMax: dailyTemperature2mMax[j],
          temperature2mMin: dailyTemperature2mMin[j],
          temperature2mMean: dailyTemperature2mMean[j],
          apparentTemperatureMax: dailyApparentTemperatureMax[j],
          apparentTemperatureMin: dailyApparentTemperatureMin[j],
          // Saved in UTC
          sunrise: new Date(Number(dailySunrise?.valuesInt64(j)) * 1000),
          // Saved in UTC
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
    const buffer = `${this.apiDayPadding + 1} days`

    console.log(
      'Linking locations to weather info. This might take a while if there are a lot of loactions missing weather information'
    )
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
        NOT EXISTS (select 1 from locations where ${locationsTable.dailyWeatherId} = ${dailyWeatherTable.id})
      `)
    await tx.delete(hourlyWeatherTable).where(sql`
        NOT EXISTS (select 1 from locations where ${locationsTable.hourlyWeatherId} = ${hourlyWeatherTable.id})
      `)
  }

  /**
   * This function assumes that the pairs array is sorted from earliest to latest
   */
  private findEarliestAndLatest(
    entries: NewHourlyWeather[],
    currentFirst: DateTime | undefined,
    currentLast: DateTime | undefined
  ) {
    let first = currentFirst
    let last = currentLast
    const firstDt = DateTime.fromJSDate(entries[0].date, { zone: 'UTC' })
    if (!currentFirst || currentFirst.diff(firstDt).milliseconds > 0) {
      first = firstDt
    }

    const lastDt = DateTime.fromJSDate(entries[entries.length - 1].date, {
      zone: 'UTC',
    })
    if (!currentLast || currentLast.diff(lastDt).milliseconds < 0) {
      last = lastDt
    }

    return { first, last }
  }

  public async import(params: {
    tx: DBTransaction
    placeholderJobId: number
  }): Promise<{
    importedCount: number
    firstEntryDate: Date
    lastEntryDate: Date
    apiCallsCount?: number
    logs: string[]
  }> {
    let locationDatePairs:
      | { location: Point; dayString: string; timezone: string }[]
      | undefined

    let importedCount = 0

    let firstDate: DateTime | undefined
    let lastDate: DateTime | undefined

    let apiCallsCount = 0

    while (locationDatePairs?.length !== 0) {
      locationDatePairs = await this.getLocationAndDate(params.tx)

      if (locationDatePairs.length === 0) {
        break
      }

      // When this was done I didn't know you could pass a list of timezones to the API call
      const byTimezone = locationDatePairs.reduce((acc, curr) => {
        acc[curr.timezone] = [...(acc[curr.timezone] ?? []), curr]
        return acc
      }, {} as Record<string, typeof locationDatePairs>)

      for (const timezone of Object.keys(byTimezone)) {
        const sameTimezonePairs = byTimezone[timezone]
        const earliestDay = sameTimezonePairs[0].dayString
        const latestDay =
          sameTimezonePairs[sameTimezonePairs.length - 1].dayString

        console.log('Waiting before calling API again')
        await delay(this.apiCallsDelay)
        console.log(
          `Calling API for days ${earliestDay} - ${latestDay} and timezone ${timezone}`
        )
        apiCallsCount += 1

        // The API calls are really wasteful here. If there are 2 points: Point A and Point B
        // They are in completly different locations and were recorded in completely different
        // days we call the API with both of the points for both days, so in this scenario we get
        // duplicated data. This is something that can improve in the implementation
        // It was initially done like this to avoid doing too many API calls, but I've recently discovered
        // that they weight API calls by how many days/points are being requested so the initial
        // assumption doesn't make sense anymore
        const result = await this.callApi(
          sameTimezonePairs.map((l) => l.location),
          earliestDay,
          latestDay,
          timezone
        )

        const firstAndLatest = this.findEarliestAndLatest(
          result.hourly,
          firstDate,
          lastDate
        )
        firstDate = firstAndLatest.first
        lastDate = firstAndLatest.last

        // Chunk to avoid from exceeding postgres' parameter count limit
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
        importedCount += result.daily.length + result.hourly.length
      }
      // Link, but only based on the dates that we have seen already. This could be better since this will only increase
      // as we go. But in the function we also check for null daily_weather_id and hourly_weather_id so hopefuly it doesn't
      // make a big impact. This is just a workaround for now
      await this.linkLocationsToWeather(params.tx, firstDate, lastDate)

      if (importedCount >= this.maxImportSession) {
        break
      }
      //   await this.cleanUpDanglingWeatherEntries(params.tx)
    }

    await this.linkLocationsToWeather(params.tx)
    await this.cleanUpDanglingWeatherEntries(params.tx)

    console.log('Done importing weather information')
    return {
      importedCount,
      apiCallsCount,
      lastEntryDate: lastDate?.toJSDate() ?? this.placeholderDate,
      firstEntryDate: firstDate?.toJSDate() ?? this.placeholderDate,
      logs: [],
    }
  }
}

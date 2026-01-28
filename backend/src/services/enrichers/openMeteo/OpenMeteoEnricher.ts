import { asc, eq, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import config from "../../../config";
import type { DBTransaction, Point } from "../../../db/types";
import { delay } from "../../../helpers/delay";
import { dailyWeatherTable, hourlyWeatherTable, locationsTable } from "../../../models";
import { Logger } from "../../Logger";
import { OpenMeteo } from "../../openMeteo/OpenMeteo";
import { BaseEnricher } from "../BaseEnricher";

export class OpenMeteoEnricher extends BaseEnricher {
  // Needs to be a valid postgres interval
  // The API seems to have a delay of 2 days
  private dataAvailabilityDelay = "3 days";

  private apiCallsDelay = config.enrichers.locationDetails.openMeteo.apiCallsDelay;
  private maxImportSessionDuration = config.enrichers.locationDetails.openMeteo.maxImportSessionDuration;
  private locationWindowInMeters = config.enrichers.locationDetails.openMeteo.locationWindowInMeters;

  protected logger = new Logger("OpenMeteoEnricher");
  protected openMeteoApi = new OpenMeteo();

  public isEnabled(): boolean {
    return config.enrichers.locationDetails.openMeteo.enabled;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    const startTime = DateTime.now();
    let apiCallsCount = 0;
    let cacheHits = 0;
    let lastLogAt = DateTime.now();
    const LOG_EVERY_MS = 5_000;

    let locationDatePairs: Awaited<ReturnType<typeof this.getLocationAndDate>> | undefined;

    this.logger.info("Initiating OpenMeteoEnricher");
    let wasLastCallCached = false;
    while (locationDatePairs?.length !== 0) {
      locationDatePairs = await this.getLocationAndDate(tx);

      if (locationDatePairs.length === 0) {
        this.logger.info("No new locations to fetch data for");
        break;
      }

      for (const locationDate of locationDatePairs) {
        if (!locationDate.date) {
          this.logger.debug("No date in locationDate");
          continue;
        }
        this.logger.info("Processing weather data for location recorded at", { recordedAt: locationDate.date });
        if (!wasLastCallCached) {
          this.logger.debug("Waiting before calling API again");
          await delay(this.apiCallsDelay);
        }

        const result = await this.openMeteoApi.fetchHistorical({
          point: locationDate.location,
          date: DateTime.fromJSDate(locationDate.date, { zone: "UTC" }),
          timezone: locationDate.timezone,
        });

        if (result.wasCached) {
          cacheHits++;
        } else {
          apiCallsCount++;
        }
        wasLastCallCached = result.wasCached;

        let insertedHourlyWeather: { id: number; startOfHour: DateTime; endOfHour: DateTime } | null = null;
        let insertedDailyWeather: { id: number; startOfDay: DateTime; endOfDay: DateTime } | null = null;
        // TODO: The user won't move a lot in between location matches and also realistically the user might be in
        // the same area for a few days. The call that we do to openmeteo already returns more data (which is
        // surfaced through the "all" property of the result). Ideally we would use that to avoid calling this.openMeteoApi
        // again. But for the time being it's okay to spam our own s3 endpoint during big imports
        if (result.match.hour) {
          this.logger.debug("Inserting new hourly record", { date: result.match.hour.date.toISO() });
          const hourly = this.openMeteoApi.hourlyDataToDatabase(result.match.hour);
          const inserted = await tx
            .insert(hourlyWeatherTable)
            .values(hourly)
            // Use this over onConflictDoNothing so we guarantee to always get something back
            .onConflictDoUpdate({
              target: [hourlyWeatherTable.location, hourlyWeatherTable.date],
              set: {
                id: sql`${hourlyWeatherTable.id}`,
              },
            })
            .returning({
              id: hourlyWeatherTable.id,
              date: hourlyWeatherTable.date,
            });
          insertedHourlyWeather = {
            id: inserted[0].id,
            startOfHour: DateTime.fromJSDate(inserted[0].date, { zone: "UTC" }).startOf("hour"),
            endOfHour: DateTime.fromJSDate(inserted[0].date, { zone: "UTC" }).endOf("hour"),
          };
        }
        if (result.match.day) {
          this.logger.debug("Inserting new daily record", { day: result.match.day.day });
          const daily = this.openMeteoApi.dailyDataToDatabase(result.match.day);
          const inserted = await tx
            .insert(dailyWeatherTable)
            .values(daily)
            // Use this over onConflictDoNothing so we guarantee to always get something back
            .onConflictDoUpdate({
              target: [dailyWeatherTable.location, dailyWeatherTable.date],
              set: {
                id: sql`${dailyWeatherTable.id}`,
              },
            })
            .returning({
              id: dailyWeatherTable.id,
              date: dailyWeatherTable.date,
            });
          const dayInTimezone = DateTime.fromSQL(inserted[0].date, { zone: locationDate.timezone });

          insertedDailyWeather = {
            id: inserted[0].id,
            startOfDay: dayInTimezone.startOf("day").toUTC(),
            endOfDay: dayInTimezone.endOf("day").toUTC(),
          };
        }

        if (!result.match.day || !result.match.hour) {
          await tx
            .update(locationsTable)
            .set({
              failedtoFetchWeather: true,
            })
            .where(eq(locationsTable.id, locationDate.id));
        }

        if (insertedDailyWeather && insertedHourlyWeather) {
          await this.linkLocationsToWeather(tx, {
            weatherLocation: locationDate.location,
            hourly: insertedHourlyWeather,
            daily: insertedDailyWeather,
          });
        }
      }

      const now = DateTime.now();
      if (Math.abs(now.diff(lastLogAt, "milliseconds").milliseconds) >= LOG_EVERY_MS) {
        const elapsedSec = Math.abs(now.diff(startTime, "seconds").seconds);
        const rate = Math.round((apiCallsCount + cacheHits) / elapsedSec);

        this.logger.info("Progress", {
          cacheHits,
          apiCallsCount,
          elapsedSec: elapsedSec.toFixed(1),
          linesPerSec: rate,
          lastDate: locationDatePairs ? locationDatePairs[locationDatePairs.length - 1].date?.toISOString() : null,
        });

        lastLogAt = now;
      }

      // If it has been running for longer than allowed, break out of the loop
      if (Math.abs(startTime.diffNow("seconds").seconds) >= this.maxImportSessionDuration) {
        this.logger.debug("Enricher is running for too long, breaking...");
        break;
      }
    }
  }

  /**
   * Fetches a list of location, date and timezones.
   */
  private getLocationAndDate(tx: DBTransaction) {
    return (
      tx
        .select({
          location: locationsTable.location,
          accuracy: locationsTable.accuracy,
          date: locationsTable.recordedAt,
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
            ${locationsTable.recordedAt} < NOW() - INTERVAL '${sql.raw(this.dataAvailabilityDelay)}
            AND NOT ${locationsTable.failedtoFetchWeather}
          '
        `,
        )
        .orderBy(asc(locationsTable.recordedAt))
        // Do it one at a time because the points created right after are probably within the same area
        // so they'll probably get linked with the data we're pulling from this call
        .limit(1)
    );
  }

  /**
   *
   * @param tx The DB transaction
   * @param params.weatherLocation the location that the data was requested for
   * @param params.hourly.startOfHour the start of the hour that is "covered" by this data. In UTC
   * @param params.hourly.endOfHour the end of the hour that is "covered" by this data. In UTC
   * @param params.daily.startOfDay the start of the day that is "covered" by this data. In UTC
   * @param params.daily.endOfDay the end of the day that is "covered" by this data. In UTC
   */
  private async linkLocationsToWeather(
    tx: DBTransaction,
    params: {
      weatherLocation: Point;
      hourly: {
        startOfHour: DateTime;
        endOfHour: DateTime;
        id: number;
      };
      daily: {
        startOfDay: DateTime;
        endOfDay: DateTime;
        id: number;
      };
    },
  ) {
    this.logger.debug("Linking locations to weather info...");

    const locationPoint = sql`
        ST_SetSRID(
          ST_MakePoint(${params.weatherLocation.lng}, ${params.weatherLocation.lat}),
          4326
        )::geography
      `;
    await tx
      .update(locationsTable)
      .set({
        hourlyWeatherId: params.hourly.id,
      })
      .where(sql`
      ${locationsTable.hourlyWeatherId} IS NULL
      AND ${locationsTable.recordedAt} >= ${params.hourly.startOfHour.toISO()}
      AND ${locationsTable.recordedAt} <= ${params.hourly.endOfHour.toISO()}
      AND ST_DWithin(
            ${locationsTable.location},
            ${locationPoint},
            ${this.locationWindowInMeters}
          )
      `);

    await tx
      .update(locationsTable)
      .set({
        dailyWeatherId: params.daily.id,
      })
      .where(sql`
      ${locationsTable.dailyWeatherId} IS NULL
      AND ${locationsTable.recordedAt} >= ${params.daily.startOfDay.toISO()}
      AND ${locationsTable.recordedAt} <= ${params.daily.endOfDay.toISO()}
      AND ST_DWithin(
            ${locationsTable.location},
            ${locationPoint},
            ${this.locationWindowInMeters}
          )
      `);
  }
}

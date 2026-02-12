import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import type { PgSelectHKT, PgSelectQueryBuilder } from "drizzle-orm/pg-core";
import type { DateTime } from "luxon";
import z from "zod";
import config from "../../config";
import { db } from "../../db/connection";
import type { DBTransaction, Point } from "../../db/types";
import { isNumber } from "../../helpers/isNumber";
import { locationsTable } from "../../models";
import { locationDetailsTable } from "../../models/LocationDetails";
import { type PlaceOfInterest, placesOfInterestTable } from "../../models/PlaceOfInterest";
import type { DateRange } from "../../types/chartTypes";
import { LuxonDateTime } from "../../types/zodTypes";
import { getCountryName } from "../common/getCountryName";
import { getIslandsCte } from "./gapsAndIslands";

export const HeatmapInput = z
  .object({
    topLeftLat: z.coerce.number(),
    topLeftLng: z.coerce.number(),
    bottomRightLat: z.coerce.number(),
    bottomRightLng: z.coerce.number(),
    zoom: z.coerce.number(),
    startDate: LuxonDateTime,
    endDate: LuxonDateTime,
  })
  .partial()
  .required({
    topLeftLat: true,
    topLeftLng: true,
    bottomRightLat: true,
    bottomRightLng: true,
    zoom: true,
  });

export interface LocationTimelineActivity {
  startDate: Date;
  endDate: Date;
  velocity: number;
  timezone: string;
  duration: unknown;
  placeOfInterest: {
    displayName: string | null;
    geoJson: PlaceOfInterest["geoJson"] | null;
  };
  mode: string;
}

export class LocationServiceInternal {
  public async getTimezoneForDate(tx: DBTransaction, date: DateTime): Promise<{ timezone: string } | undefined> {
    return tx
      .select({ timezone: locationsTable.timezone })
      .from(locationsTable)
      .where(
        and(
          // Within a day of the requested date
          gte(locationsTable.recordedAt, date.minus({ day: 1 }).toJSDate()),
          lte(locationsTable.recordedAt, date.plus({ day: 1 }).toJSDate()),
        ),
      )
      .orderBy(sql`ABS(EXTRACT(EPOCH FROM ${locationsTable.recordedAt} - ${date.toISO()}))`)
      .limit(1)
      .then((result) => result[0]);
  }
}

export class LocationChartServiceInternal {
  /**
   * Gets all the cities visited within a time range.
   */
  public async getCitiesVisited(params: DateRange) {
    const islandsCte = getIslandsCte({
      dateFilter: { range: params },
      accuracyFilterInMeters: 100,
      activityDurationFilterInMin: config.charts.citiesVisited.minimumTimeInMin,
      placeKey: locationDetailsTable.city,
    });

    return db
      .with(islandsCte)
      .select({
        city: sql`${islandsCte.placeKey}`.mapWith(String),
        timeSpentInSec: sum(islandsCte.duration).mapWith(Number),
      })
      .from(islandsCte)
      .where(sql`
        ${islandsCte.placeKey} IS NOT NULL
        -- Still necessary because the islands don't guarantee filtering out if there isn't multiple
        -- keys within the same bucket
        AND ${islandsCte.duration} > ${config.charts.citiesVisited.minimumTimeInMin * 60}`)
      .groupBy(islandsCte.placeKey)
      .orderBy(desc(sum(islandsCte.duration)));
  }
  /**
   * Gets all the countries visited within a time range.
   */
  public async getCountriesVisited(params: DateRange) {
    const islandsCte = getIslandsCte({
      dateFilter: { range: params },
      accuracyFilterInMeters: 100,
      activityDurationFilterInMin: config.charts.countriesVisited.minimumTimeInMin,
      // Use country rather than country_code because for some reason nominatim doesn't always
      // return a country_code
      placeKey: locationDetailsTable.country,
    });

    const countriesVisited = await db
      .with(islandsCte)
      .select({
        country: sql`${islandsCte.placeKey}`.mapWith(String),
        timeSpentInSec: sum(islandsCte.duration).mapWith(Number),
      })
      .from(islandsCte)
      .where(sql`
        ${islandsCte.placeKey} IS NOT NULL
        -- Still necessary because the islands don't guarantee filtering out if there isn't multiple
        -- keys within the same bucket
        AND ${islandsCte.duration} > ${config.charts.countriesVisited.minimumTimeInMin * 60}
        `)
      .groupBy(islandsCte.placeKey)
      .orderBy(desc(sum(islandsCte.duration)));

    return countriesVisited.map((result) => ({
      ...result,
      country: result.country ? getCountryName(result.country) : null,
    }));
  }

  /**
   * How many times a location detail (usually useful for POIs) was visited
   */
  public async getVisitCountsByPlace(params: Partial<DateRange>) {
    const durationIslands = getIslandsCte({
      dateFilter: { range: params },
      accuracyFilterInMeters: 20,
      activityDurationFilterInMin: config.charts.placesVisited.minimumTimeInMin,
      placeKey: locationDetailsTable.id,
    });

    return db
      .with(durationIslands)
      .select({
        name: locationDetailsTable.displayName,
        id: locationDetailsTable.id,
        visits: count(durationIslands),
        timeSpentInSec: sum(durationIslands.duration),
      })
      .from(durationIslands)
      .leftJoin(locationDetailsTable, eq(locationDetailsTable.id, durationIslands.placeKey))
      .where(sql`${durationIslands.placeKey} IS NOT NULL`)
      .groupBy(locationDetailsTable.id, locationDetailsTable.displayName)
      .orderBy(desc(count(durationIslands)))
      .limit(config.charts.placesVisited.limit);
  }

  /**
   * Fetch the timeline for a given period
   */
  public async getTimeline(day: string): Promise<LocationTimelineActivity[]> {
    const durationIslands = getIslandsCte({
      dateFilter: { day },
      accuracyFilterInMeters: 20,
      activityDurationFilterInMin: config.charts.placesVisited.minimumTimeInMin,
      placeKey: locationDetailsTable.id,
    });
    return db
      .with(durationIslands)
      .select({
        startDate: durationIslands.startDate,
        endDate: durationIslands.endDate,
        velocity: durationIslands.velocity,
        timezone: durationIslands.timezone,
        duration: durationIslands.duration,
        placeOfInterest: {
          displayName: locationDetailsTable.displayName,
          geoJson: placesOfInterestTable.geoJson,
        },
        mode: sql`
        CASE
            WHEN ${durationIslands.placeKey} IS NOT NULL THEN 'still'
            WHEN ${durationIslands.velocity} < 5 THEN 'walking'
            WHEN ${durationIslands.velocity} < 25 THEN 'biking'
            WHEN ${durationIslands.velocity} < 27 THEN 'metro'
            ELSE 'driving'
        END
      `.mapWith(String),
      })
      .from(durationIslands)
      .leftJoin(locationDetailsTable, eq(locationDetailsTable.id, durationIslands.placeKey))
      .leftJoin(placesOfInterestTable, eq(locationDetailsTable.id, placesOfInterestTable.locationDetailsId))
      .orderBy(durationIslands.startDate);
  }

  public async getHeatmap(params: z.infer<typeof HeatmapInput>) {
    const { zoom, ...filterData } = params;
    const filters = {
      ...filterData,
    };
    const zoomToGrid = (zoom: number) => {
      if (zoom <= 10.1) {
        return "0.0001";
      }
      if (zoom <= 12.5) {
        return "0.00001";
      }
      return "0.000001";
    };

    const weightCap = 10;

    const location = sql<Point>`ST_SnapToGrid(location::geometry, ${sql.raw(zoomToGrid(zoom))}) AS location`.mapWith(
      locationsTable.location,
    );
    const weight = sql<number>`
                CASE
                    WHEN COUNT(*) > ${weightCap} THEN ${weightCap}
                    ELSE COUNT(*)
                END AS weight`.mapWith(Number);
    // Using sql.raw to get the grid value instead of sql bindings because
    // with bindings postgres doesn't realize that the select location expression
    // is the same as the expression in the group by. And since the value
    // is hardcoded in the function above there's no SQL injection danger
    const results = this.withPointFilters(
      db
        .select({
          location,
          // I should use some sort of softmax function here?
          weight,
        })
        .from(locationsTable)
        .$dynamic(),
      filters,
    ).groupBy(sql`ST_SnapToGrid(location::geometry, ${sql.raw(zoomToGrid(zoom))})`);

    return results;
  }

  public async getCount() {
    return db
      .select({
        count: count(),
      })
      .from(locationsTable)
      .then((r) => r[0].count);
  }

  // =============== PRIVATE ===================
  private withPointFilters<T extends PgSelectQueryBuilder<PgSelectHKT, typeof locationsTable._.name>>(
    qb: T,
    filters: Omit<z.infer<typeof HeatmapInput>, "zoom">,
  ) {
    const { topLeftLat, topLeftLng, bottomRightLat, bottomRightLng, startDate, endDate } = filters;
    return qb.where(
      sql`
            ${
              isNumber(topLeftLat) && isNumber(topLeftLng) && isNumber(bottomRightLat) && isNumber(bottomRightLng)
                ? sql`
                    ST_Intersects(
                        ${locationsTable.location},
                        ST_MakeEnvelope(
                            ${topLeftLng}, ${topLeftLat}, 
                            ${bottomRightLng}, ${bottomRightLat}, 
                            4326
                        )
                    ) 
            `
                : sql.raw("1=1")
            }
            ${startDate ? sql`AND ${locationsTable.recordedAt} >= ${startDate.toISO()}` : sql``}
            ${endDate ? sql`AND  ${locationsTable.recordedAt} <= ${endDate.toISO()}` : sql``}
          `,
    );
  }
}

export const LocationChartService = new LocationChartServiceInternal();
export const LocationService = new LocationServiceInternal();

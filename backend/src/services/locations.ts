import { sql, eq, asc, avg, min, max } from 'drizzle-orm'
import type { PgSelectHKT, PgSelectQueryBuilder } from 'drizzle-orm/pg-core'
import { db } from '../db/connection'
import type { Point } from '../db/types'
import { locationsTable } from '../models'
import { locationDetailsTable } from '../models/LocationDetails'
import type { DateTime } from 'luxon'
import { isNumber } from '../helpers/isNumber'
import { orderBy } from 'lodash'

function withPointFilters<
  T extends PgSelectQueryBuilder<PgSelectHKT, typeof locationsTable._.name>
>(
  qb: T,
  filters: {
    topLeftLat?: number
    topLeftLng?: number
    bottomRightLat?: number
    bottomRightLng?: number
    startDate?: DateTime
    endDate?: DateTime
  }
) {
  const {
    topLeftLat,
    topLeftLng,
    bottomRightLat,
    bottomRightLng,
    startDate,
    endDate,
  } = filters
  return qb.where(
    sql`
            ${
              isNumber(topLeftLat) &&
              isNumber(topLeftLng) &&
              isNumber(bottomRightLat) &&
              isNumber(bottomRightLng)
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
                : sql.raw('1=1')
            }
            ${
              startDate
                ? sql`AND ${locationsTable.locationFix} >= ${startDate.toISO()}`
                : sql``
            }
            ${
              endDate
                ? sql`AND  ${locationsTable.locationFix} <= ${endDate.toISO()}`
                : sql``
            }
          `
  )
}

export async function getLocationsTimeline(params: {
  startDate: DateTime
  endDate: DateTime
}) {
  const accuracyFilter = 30
  const activityDurationFilter = 10

  // Prepare the locations table to be groupped in gaps/islands. Also applies base filters
  // Gap and Islands https://stackoverflow.com/questions/55654156/group-consecutive-rows-based-on-one-column
  const baseLocations = db.$with('base_locations').as((cte) =>
    cte
      .select({
        id: locationsTable.id,
        locationFix: locationsTable.locationFix,
        velocity: locationsTable.velocity,
        locationDetailsId: locationsTable.locationDetailsId,
        totalSeq: sql`
        --   // Very important to use the id as a tie break since location fix can have duplicates
        --   // https://stackoverflow.com/questions/30877926/how-to-group-following-rows-by-not-unique-value/30880137#30880137
            row_number() over (order by ${locationsTable.locationFix} asc, ${locationsTable.id} asc)
        `.as('total_seq'),
        partitionSeq: sql`
            row_number() over (partition by ${locationsTable.locationDetailsId} order by ${locationsTable.locationFix} asc, ${locationsTable.id} asc)
        `.as('parition_seq'),
      })
      .from(locationsTable)
      .where(
        sql`
            ${locationsTable.locationDetailsId} IS NOT NULL
            AND ${locationsTable.accuracy} < ${accuracyFilter}
            ${
              params.startDate
                ? sql`AND ${
                    locationsTable.locationFix
                  } >= ${params.startDate.toISO()}`
                : sql``
            }
            ${
              params.endDate
                ? sql`AND  ${
                    locationsTable.locationFix
                  } <= ${params.endDate.toISO()}`
                : sql``
            }
      `
      )
  )
  // Groups the gaps and islands
  const baseActivitiesIslands = db.$with('activities_islands').as((cte) =>
    cte
      .with(baseLocations)
      .select({
        startDate: min(baseLocations.locationFix).as('ai_start_date'),
        endDate: max(baseLocations.locationFix).as('ai_end_date'),
        duration: sql`EXTRACT(EPOCH FROM (
                ${max(baseLocations.locationFix)} - 
                ${min(baseLocations.locationFix)})
            )`.as('ai_duration'),
        velocity: avg(baseLocations.velocity).mapWith(Number).as('ai_velocity'),
        locationDetailsId: baseLocations.locationDetailsId,
      })
      .from(baseLocations)
      .orderBy(asc(min(baseLocations.locationFix)))
      .groupBy(
        sql`${baseLocations.locationDetailsId},  (${baseLocations.totalSeq} - ${baseLocations.partitionSeq})`
      )
  )

  // Now prepare to generate gaps and islands based on the duration of each activity
  // Short duration locations detials are groupped together as "in transit". The locations details
  // are really precise so every few meters they'll change. We want to group them and find the ones
  // that are repeated for some time which means that the user stopped moving in a single location
  const activitiesIslands = db.$with('durations_islands').as((cte) =>
    cte
      .with(baseActivitiesIslands)
      .select({
        startDate: baseActivitiesIslands.startDate,
        endDate: baseActivitiesIslands.endDate,
        duration: baseActivitiesIslands.duration,
        velocity: baseActivitiesIslands.velocity,
        locationDetailsId: baseActivitiesIslands.locationDetailsId,
        totalSeq: sql`
            row_number() over (
                order by ${baseActivitiesIslands.startDate} asc, 
                ${baseActivitiesIslands.locationDetailsId} asc
            )
        `.as('di_total_seq'),
        partitionSeq: sql`
            row_number() over (
                partition by ${baseActivitiesIslands.duration} > (60 * ${activityDurationFilter})
                order by ${baseActivitiesIslands.startDate} asc, 
                ${baseActivitiesIslands.locationDetailsId} asc
            )
        `.as('di_partition_seq'),
      })
      .from(baseActivitiesIslands)
  )
  const durationIslands = db.$with('durations_islands').as((cte) =>
    cte
      .with(activitiesIslands)
      .select({
        startDate: min(activitiesIslands.startDate).as('di_start_date'),
        endDate: max(activitiesIslands.endDate).as('di_end_date'),
        velocity: avg(activitiesIslands.velocity)
          .mapWith(Number)
          .as('di_velocity'),
        locationDetailsId: sql`
            CASE 
                WHEN POSITION(',' IN string_agg(${activitiesIslands.locationDetailsId}::text, ',')) > 0 THEN NULL
                ELSE string_agg(${activitiesIslands.locationDetailsId}::text, ',')::integer
            END 
        `.as('di_location_details_id'),
        duration: sql`
        EXTRACT(EPOCH FROM (
            ${max(activitiesIslands.endDate)} - 
            ${min(activitiesIslands.startDate)})
        )`.as('di_duration'),
      })
      .from(activitiesIslands)
      .groupBy(
        sql`(${activitiesIslands.totalSeq} - ${activitiesIslands.partitionSeq})`
      )
      .orderBy(min(activitiesIslands.startDate))
  )

  return db
    .with(durationIslands)
    .select({
      startDate: durationIslands.startDate,
      endDate: durationIslands.endDate,
      velocity: durationIslands.velocity,
      duration: durationIslands.duration,
      placeOfInterest: locationDetailsTable,
      mode: sql`
        CASE
            WHEN ${durationIslands.locationDetailsId} IS NOT NULL THEN 'still'
            WHEN ${durationIslands.velocity} < 5 THEN 'walking'
            WHEN ${durationIslands.velocity} < 25 THEN 'biking'
            WHEN ${durationIslands.velocity} < 27 THEN 'metro'
            ELSE 'driving'
        END
      `.mapWith(String),
    })
    .from(durationIslands)
    .leftJoin(
      locationDetailsTable,
      eq(locationDetailsTable.id, durationIslands.locationDetailsId)
    )
    .orderBy(durationIslands.startDate)
}

export async function getHeatmapPoints(params: {
  zoom: number
  startDate: DateTime
  endDate: DateTime

  topLeftLat: number
  topLeftLng: number
  bottomRightLat: number
  bottomRightLng: number
}) {
  const { zoom, ...filterData } = params
  const filters = {
    ...filterData,
  }
  const zoomToGrid = (zoom: number) => {
    if (zoom <= 10.1) {
      return '0.0001'
    }
    if (zoom <= 12.5) {
      return '0.00001'
    }
    return '0.000001'
  }

  const weightCap = 10

  // Using sql.raw to get the grid value instead of sql bindings because
  // with bindings postgres doesn't realize that the select location expression
  // is the same as the expression in the group by. And since the value
  // is hardcoded in the function above there's no SQL injection danger
  const results = withPointFilters(
    db
      .select({
        location: sql<Point>`ST_SnapToGrid(location::geometry, ${sql.raw(
          zoomToGrid(zoom)
        )}) AS location`.mapWith(locationsTable.location),
        // I should use some sort of softmax function here?
        weight: sql<number>`
                CASE
                    WHEN COUNT(*) > ${weightCap} THEN ${weightCap}
                    ELSE COUNT(*)
                END AS weight`.mapWith(Number),
      })
      .from(locationsTable)
      .$dynamic(),
    filters
  ).groupBy(
    sql`ST_SnapToGrid(location::geometry, ${sql.raw(zoomToGrid(zoom))})`
  )

  return results
}

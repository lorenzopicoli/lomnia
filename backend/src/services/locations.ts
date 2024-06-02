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

export async function getVisitedPlaces(params: {
  startDate: DateTime
  endDate: DateTime
}) {
  // Gap and Islands https://stackoverflow.com/questions/55654156/group-consecutive-rows-based-on-one-column
  const locationsCte = db.$with('locations_cte').as((cte) =>
    cte
      .select({
        date: locationsTable.locationFix,
        locationDetailsId: locationsTable.locationDetailsId,
        seqnum:
          // Very important to use the id as a tie break since location fix can have duplicates
          // https://stackoverflow.com/questions/30877926/how-to-group-following-rows-by-not-unique-value/30880137#30880137
          sql`row_number() over (order by ${locationsTable.locationFix} asc, ${locationsTable.id} asc)`
            .mapWith(Number)
            .as('seqnum'),
        setqnumI:
          // Very important to use the id as a tie break since location fix can have duplicates
          // https://stackoverflow.com/questions/30877926/how-to-group-following-rows-by-not-unique-value/30880137#30880137
          sql`row_number() over (partition by ${locationsTable.locationDetailsId} order by ${locationsTable.locationFix} asc, ${locationsTable.id} asc)`
            .mapWith(Number)
            .as('seqnum_i'),
      })
      .from(locationsTable)
      .where(
        sql`
            ${locationsTable.locationDetailsId} IS NOT NULL
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
      .orderBy(asc(locationsTable.locationFix))
  )
  // .groupBy(locationDetailsTable.id)

  const results = await db
    .with(locationsCte)
    .select({
      startDate: min(locationsCte.date),
      endDate: max(locationsCte.date),
      placeOfInterest: locationDetailsTable,
    })
    .from(locationsCte)
    .innerJoin(
      locationDetailsTable,
      eq(locationDetailsTable.id, locationsCte.locationDetailsId)
    )
    .groupBy(
      sql`${locationDetailsTable.id},  (${locationsCte.seqnum} - ${locationsCte.setqnumI})`
    )
    .orderBy(min(locationsCte.date))

  return results
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
      return '0.001'
    }
    if (zoom <= 12.5) {
      return '0.0001'
    }
    return '0.00001'
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

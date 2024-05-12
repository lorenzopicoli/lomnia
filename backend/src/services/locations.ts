import { sql } from 'drizzle-orm'
import type { PgSelectQueryBuilder } from 'drizzle-orm/pg-core'
import { db } from '../db/connection'
import { locationsTable } from '../db/schema'
import type { Point } from '../db/types'
import type { GetHeatmapQueryParams } from '../routes/locations'

function withPointFilters<T extends PgSelectQueryBuilder>(
  qb: T,
  filters: {
    topLeftLat: number
    topLeftLng: number
    bottomRightLat: number
    bottomRightLng: number
    startDate?: Date
    endDate?: Date
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
            ST_Intersects(
                locations.location,
                ST_MakeEnvelope(
                    ${topLeftLng}, ${topLeftLat}, 
                    ${bottomRightLng}, ${bottomRightLat}, 
                    4326
                )
            ) 
            ${
              startDate
                ? sql`AND location_fix >= ${startDate.toISOString()}`
                : sql``
            }
            ${
              endDate
                ? sql`AND location_fix <= ${endDate.toISOString()}`
                : sql``
            }
          `
  )
}

export async function getHeatmapPoints(params: GetHeatmapQueryParams) {
  const { zoom, ...filterData } = params
  const filters = {
    ...filterData,
    startDate: filterData.startDate
      ? new Date(filterData.startDate)
      : undefined,
    endDate: filterData.endDate ? new Date(filterData.endDate) : undefined,
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
                    WHEN COUNT(*) > 10 THEN 10
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

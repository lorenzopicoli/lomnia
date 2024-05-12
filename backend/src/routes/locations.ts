import { sql } from 'drizzle-orm'
import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { z } from 'zod'
import { db } from '../db/connection'
import { locationsTable } from '../db/schema'
import type { Point } from '../db/types'

const GetHeatmapQueryParams = z
  .object({
    topLeftLat: z.coerce.number(),
    topLeftLng: z.coerce.number(),
    bottomRightLat: z.coerce.number(),
    bottomRightLng: z.coerce.number(),
    zoom: z.coerce.number(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .partial()
  .required({
    topLeftLat: true,
    topLeftLng: true,
    bottomRightLat: true,
    bottomRightLng: true,
    zoom: true,
  })

// type GetHeatmapQueryParams = z.infer<typeof GetHeatmapQueryParams>

const getHeatmap: RouteHandlerMethod = async (request, reply) => {
  const queryParams = GetHeatmapQueryParams.safeParse(request.query)

  if (!queryParams.data || queryParams.error) {
    reply
      .send({
        error: queryParams.error,
      })
      .status(400)
    return
  }

  const {
    topLeftLat,
    topLeftLng,
    bottomRightLat,
    bottomRightLng,
    zoom,
    startDate,
    endDate,
  } = queryParams.data

  try {
    const zoomToGrid = (zoom: number) => {
      if (zoom <= 10.1) {
        return '0.001'
      }
      if (zoom <= 12.5) {
        return '0.0001'
      }
      return '0.00001'
    }

    const results = await db
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
      .where(
        sql`
            ST_Intersects(
                locations.location,
                ST_MakeEnvelope(
                    ${topLeftLng}, ${topLeftLat}, -- Coordinates of top left corner
                    ${bottomRightLng}, ${bottomRightLat}, -- Coordinates of bottom right corner
                    4326
                )
            ) 
            ${startDate ? sql`AND location_fix >= ${startDate}` : sql``}
            ${endDate ? sql`AND location_fix <= ${endDate}` : sql``}
          `
      )
      .groupBy(
        sql`ST_SnapToGrid(location::geometry, ${sql.raw(zoomToGrid(zoom))})`
      )
    reply.send({
      points: results.map((r) => [r.location.lng, r.location.lat, r.weight]),
    })
  } catch (e) {
    console.log('DB ERROR', e)
    reply.send(500)
  }
}

export default function locationsRoutes(fastify: FastifyInstance) {
  fastify.get('/locations/heatmap', getHeatmap)
}

import 'dotenv/config'
import cors from '@fastify/cors'
import { sql } from 'drizzle-orm'
import Fastify from 'fastify'
import { db } from './db/connection'
import { locationsTable } from './db/schema'
import type { Point } from './db/types'

const fastify = Fastify({
  logger: true,
})

export class Server {
  public async listen() {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        const hostname = new URL(origin ?? '').hostname
        if (hostname === 'localhost') {
          //  Request from localhost will pass
          cb(null, true)
          return
        }
        // Generate an error on other origins, disabling access
        cb(new Error('Not allowed'), false)
      },
    })
    fastify.get('/locations/heatmap', async (request, reply) => {
      const {
        topLeftLat,
        topLeftLng,
        bottomRightLat,
        bottomRightLng,
        zoom,
        startDate,
        endDate,
      } = request.query as {
        topLeftLat: number
        topLeftLng: number
        topRightLat: number
        topRightLng: number
        bottomRightLat: number
        bottomRightLng: number
        bottomLeftLat: number
        bottomLeftLng: number
        zoom: number
        startDate: string
        endDate: string
      }
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
          points: results.map((r) => [
            r.location.lng,
            r.location.lat,
            r.weight,
          ]),
        })
      } catch (e) {
        console.log('DB ERROR', e)
        reply.send(500)
      }
    })

    fastify.listen({ host: '0.0.0.0', port: 3010 }, async (err) => {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
      console.log('Server listening on port 3010')
    })
  }
}

new Server().listen()

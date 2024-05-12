import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { z } from 'zod'
import { getHeatmapPoints } from '../services/locations'

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

export type GetHeatmapQueryParams = z.infer<typeof GetHeatmapQueryParams>

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

  try {
    const points = await getHeatmapPoints(queryParams.data)
    reply.send({
      // Can I do this some other way and not have to map over the points?
      points: points.map((r) => [r.location.lng, r.location.lat, r.weight]),
    })
  } catch (e) {
    console.log('DB ERROR', e)
    reply.send(500)
  }
}

export default function locationsRoutes(fastify: FastifyInstance) {
  fastify.get('/locations/heatmap', getHeatmap)
}

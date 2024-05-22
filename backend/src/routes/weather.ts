import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { z } from 'zod'
import { getWeatherInformation } from '../services/weather'

const GetWeatherInformationQueryParams = z.object({
  date: z.string().date(),
})

export type GetWeatherQueryParams = z.infer<
  typeof GetWeatherInformationQueryParams
>

const getWeatherRouteHandler: RouteHandlerMethod = async (request, reply) => {
  const queryParams = GetWeatherInformationQueryParams.safeParse(request.query)

  if (!queryParams.data || queryParams.error) {
    reply
      .send({
        error: queryParams.error,
      })
      .status(400)
    return
  }

  try {
    const weatherInfo = await getWeatherInformation(queryParams.data)
    return reply.send(weatherInfo)
  } catch (e) {
    console.log('DB ERROR', e)
    return reply.send(500)
  }
}

export default function weatherRoutes(fastify: FastifyInstance) {
  return fastify.get('/weather', getWeatherRouteHandler)
}

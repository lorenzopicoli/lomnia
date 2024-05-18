import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { z } from 'zod'
import { getDiaryEntries } from '../services/diaryEntries'

const GetDiaryQueryParams = z.object({
  date: z.string().date(),
  privateMode: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

export type GetDiaryQueryParams = z.infer<typeof GetDiaryQueryParams>

const getDiaryEntry: RouteHandlerMethod = async (request, reply) => {
  const queryParams = GetDiaryQueryParams.safeParse(request.query)

  if (!queryParams.data || queryParams.error) {
    reply
      .send({
        error: queryParams.error,
      })
      .status(400)
    return
  }

  try {
    const diaryEntry = await getDiaryEntries(queryParams.data)
    return reply.send(diaryEntry)
  } catch (e) {
    console.log('DB ERROR', e)
    return reply.send(500)
  }
}

export default function diaryRoutes(fastify: FastifyInstance) {
  return fastify.get('/diary-entries', getDiaryEntry)
}

import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { z } from 'zod'
import { getHabits } from '../services/habits/habits'

const GetHabitEntriesQueryParams = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  privateMode: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

export type GetHabitEntriesParams = z.infer<typeof GetHabitEntriesQueryParams>

const getHabitEntries: RouteHandlerMethod = async (request, reply) => {
  const queryParams = GetHabitEntriesQueryParams.safeParse(request.query)

  if (!queryParams.data || queryParams.error) {
    reply
      .send({
        error: queryParams.error,
      })
      .status(400)
    return
  }

  try {
    const habits = await getHabits(queryParams.data)
    return reply.send(habits)
  } catch (e) {
    console.log('DB ERROR', e)
    return reply.send(500)
  }
}

export default function diaryRoutes(fastify: FastifyInstance) {
  return fastify.get('/habit-entries', getHabitEntries)
}

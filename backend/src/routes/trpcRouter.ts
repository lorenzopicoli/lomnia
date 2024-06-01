import { initTRPC } from '@trpc/server'
// import { parseISO } from 'date-fns'
import { DateTime } from 'luxon'
import { z } from 'zod'
import { getDiaryEntries } from '../services/diaryEntries'
import {
  getHabits,
  getHabitsAnalytics,
  getHabitsAnalyticsLineCharts,
} from '../services/habits/habits'
import { getHeatmapPoints } from '../services/locations'
import {
  getWeatherAnalytics,
  getWeatherAnalyticsLineCharts,
  getWeatherInformation,
} from '../services/weather'
import { parseISO } from 'date-fns'

export const t = initTRPC.create()

export const loggedProcedure = t.procedure.use(async (opts) => {
  const start = Date.now()

  const result = await opts.next()

  const durationMs = Date.now() - start
  const meta = { path: opts.path, type: opts.type, durationMs }

  result.ok
    ? console.log('OK request timing:', meta)
    : console.error('Non-OK request timing', meta)

  return result
})

export const appRouter = t.router({
  getWeatherByDay: loggedProcedure
    .input(z.object({ day: z.string().date() }))
    .query((opts) => {
      return getWeatherInformation({ day: opts.input.day })
    }),
  getDiaryEntriesByDay: loggedProcedure
    .input(
      z.object({
        day: z.string().date(),
        privateMode: z.boolean(),
      })
    )
    .query((opts) => {
      return getDiaryEntries(opts.input)
    }),
  getHabitsByDay: loggedProcedure
    .input(
      z.object({
        day: z.string().date(),
        privateMode: z.boolean(),
      })
    )
    .query((opts) => {
      return getHabits(opts.input)
    }),
  getHeatmap: loggedProcedure
    .input(
      z
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
    )
    .query(async (opts) => {
      const points = await getHeatmapPoints({
        ...opts.input,
        startDate: parseISO(opts.input.startDate ?? ''),
        endDate: parseISO(opts.input.endDate ?? ''),
      })
      return points.map(
        (r) =>
          [r.location.lng, r.location.lat, r.weight] as [number, number, number]
      )
    }),

  getHottestDay: loggedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(() => {
      return {
        date: new Date(),
        temperature: 40,
        location: { x: 0, y: 0 },
      }
    }),

  getWeatherAnalytics: loggedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query((opts) => {
      return getWeatherAnalytics({
        startDate: DateTime.fromISO(opts.input.startDate, { zone: 'UTC' }),
        endDate: DateTime.fromISO(opts.input.endDate, { zone: 'UTC' }),
      })
    }),

  getHabitAnalytics: loggedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        keys: z.array(z.string()),
      })
    )
    .query((opts) => {
      return getHabitsAnalytics({
        startDate: DateTime.fromISO(opts.input.startDate, { zone: 'UTC' }),
        endDate: DateTime.fromISO(opts.input.endDate, { zone: 'UTC' }),
        keys: opts.input.keys,
      })
    }),
  getLineCharts: loggedProcedure.query(async (opts) => {
    return {
      weather: await getWeatherAnalyticsLineCharts(),
      habits: await getHabitsAnalyticsLineCharts(),
    }
  }),
})

export type AppRouter = typeof appRouter

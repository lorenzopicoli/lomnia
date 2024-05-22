import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { z } from 'zod'
import { useConfig } from './utils/useConfig'

const BASE_URL = 'http://localhost:3010'

const api = axios.create({
  baseURL: BASE_URL,
  responseType: 'json',
})

const HeatmapApiQuerySchema = z
  .object({
    topLeftLat: z.number(),
    topLeftLng: z.number(),
    bottomRightLat: z.number(),
    bottomRightLng: z.number(),
    zoom: z.number(),
    startDate: z.date(),
    endDate: z.date(),
  })
  .partial()
  .required({
    topLeftLat: true,
    topLeftLng: true,
    bottomRightLat: true,
    bottomRightLng: true,
    zoom: true,
  })

export type HeatmapApiQuery = z.infer<typeof HeatmapApiQuerySchema>

export function useHeatmapApi(query: Partial<HeatmapApiQuery>) {
  const path = '/locations/heatmap'
  return useQuery({
    queryKey: [path, query],
    // Makes sure that data isn't undefined while new request is loading
    placeholderData: (prev) => prev,
    queryFn: () => {
      const { data, success } = HeatmapApiQuerySchema.safeParse(query)
      if (!data || !success) {
        return null
      }
      return api
        .get(path, {
          params: data,
        })
        .then((d) => d.data)
    },
  })
}

const DiaryEntryApiQueryParams = z
  .object({
    date: z.string().date(),
    privateMode: z.boolean(),
  })
  .partial()
  .required({ date: true })

export type DiaryEntryQuery = z.infer<typeof DiaryEntryApiQueryParams>

export function useDiaryEntryApi(query: Partial<DiaryEntryQuery>) {
  const config = useConfig()
  const path = '/diary-entries'
  return useQuery({
    queryKey: [path, query, config.privateMode],
    queryFn: () => {
      const { data, success } = DiaryEntryApiQueryParams.safeParse({
        ...query,
        privateMode: config.privateMode,
      })
      if (!data || !success) {
        return null
      }
      return api
        .get(path, {
          params: data,
        })
        .then((d) => d.data)
    },
  })
}

const HabitEntriesApiQueryParams = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    privateMode: z.boolean(),
  })
  .partial()
  .required({ startDate: true, endDate: true })

export type HabitEntriesQuery = z.infer<typeof HabitEntriesApiQueryParams>

export function useHabitEntriesApi(query: Partial<HabitEntriesQuery>) {
  const path = '/habit-entries'
  const config = useConfig()
  return useQuery({
    queryKey: [path, query, config.privateMode],
    queryFn: () => {
      const { data, success } = HabitEntriesApiQueryParams.safeParse({
        ...query,
        privateMode: config.privateMode,
      })
      if (!data || !success) {
        return null
      }
      return api
        .get(path, {
          params: data,
        })
        .then((d) => d.data)
    },
  })
}

const WeatherApiQueryParams = z
  .object({
    date: z.string().date(),
  })
  .required()

export type WeatherApiQueryParams = z.infer<typeof WeatherApiQueryParams>

export function useWeatherApi(query: Partial<WeatherApiQueryParams>) {
  const path = '/weather'
  return useQuery({
    queryKey: [path, query],
    queryFn: () => {
      const { data, success } = WeatherApiQueryParams.safeParse({
        ...query,
      })
      if (!data || !success) {
        return null
      }
      return api
        .get(path, {
          params: data,
        })
        .then((d) => d.data)
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { z } from 'zod'

const BASE_URL = 'http://localhost:3010/'

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

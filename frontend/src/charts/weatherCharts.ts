import type { RouterOutputs } from '../api/trpc'
import { getKeys } from '../utils/getKeys'
import { getMinMax } from '../utils/getMinMax'
import { ChartSource, ChartType, type Chart, type LineData } from './charts'

// export type WeatherChart = Chart & {
//   id: WeatherPlottableField
// }

export type WeatherChart = {
  id: keyof WeatherAnalytics['entry']
  source: ChartSource.Weather
  type: ChartType
  title: string
}
// Weather
export type WeatherAnalytics = RouterOutputs['getWeatherAnalytics'][number]
export const WEATHER_PLOTTABLE_FIELDS = [
  'apparentTemperature',
  'temperature2m',
  'snowfall',
  'snowDepth',
  'windSpeed100m',
  'windSpeed10m',
  'relativeHumidity2m',
  'precipitation',
  'rain',
  'weatherCode',
  'cloudCover',
] as const

// export type WeatherPlottableField = (typeof WEATHER_PLOTTABLE_FIELDS)[number]

// export type PlottableWeatherAnalytics = Pick<
//   WeatherAnalytics['weather'],
//   WeatherPlottableField
// >

export function isWeatherChart(chart: Chart): chart is WeatherChart {
  return chart.source === ChartSource.Weather
}

export function getWeatherChart(
  weatherData: WeatherAnalytics[],
  chart: WeatherChart
): {
  id: string
  data: WeatherAnalytics[]
  lines: LineData<WeatherAnalytics>[]
} {
  const weatherMinMax =
    weatherData && weatherData.length > 0
      ? getMinMax<WeatherAnalytics, WeatherAnalytics['entry']>(
          weatherData,
          'entry',
          getKeys(weatherData[0].entry)
        )
      : null
  return {
    id: chart.id,
    data: weatherData ?? [],
    lines: [
      {
        id: chart.id,
        max: weatherMinMax?.max[chart.id].entry,
        min: weatherMinMax?.min[chart.id].entry,
        accessors: {
          getX: (data: WeatherAnalytics) => new Date(data.date),
          getY: (data: WeatherAnalytics) => data.entry[chart.id] ?? 0,
        },
        labels: {
          description: chart.title,
          showMaxLabel: false,
          showMinLabel: false,
          maxLabel: (value: number, unit: string) =>
            `Highest point: ${value}${unit}`,
          minLabel: (value: number, unit: string) =>
            `Lowest point: ${value}${unit}`,
          unit: '',
        },
      },
    ],
  }
}

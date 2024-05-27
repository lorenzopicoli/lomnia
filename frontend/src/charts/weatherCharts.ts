import type { RouterOutputs } from '../api/trpc'
import {
  ChartSource,
  unitToLabel,
  type Chart,
  type StaticLineData,
} from './charts'

export type WeatherChart = Chart & {
  id: WeatherPlottableField
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

export type WeatherPlottableField = (typeof WEATHER_PLOTTABLE_FIELDS)[number]

export type PlottableWeatherAnalytics = Pick<
  WeatherAnalytics['weather'],
  WeatherPlottableField
>

export function isWeatherChart(chart: Chart): chart is WeatherChart {
  return (
    chart.source === ChartSource.Weather &&
    WEATHER_PLOTTABLE_FIELDS.includes(chart.id as WeatherPlottableField)
  )
}

export const weatherGetYs: Record<
  WeatherPlottableField,
  (data: Required<WeatherAnalytics>) => number
> = {
  apparentTemperature: (data) => data.weather.apparentTemperature ?? 0,
  temperature2m: (data) => data.weather.temperature2m ?? 0,
  snowfall: (data) => data.weather.snowfall ?? 0,
  snowDepth: (data) => data.weather.snowDepth ?? 0,
  windSpeed100m: (data) => data.weather.windSpeed100m ?? 0,
  windSpeed10m: (data) => data.weather.windSpeed10m ?? 0,
  relativeHumidity2m: (data) => data.weather.relativeHumidity2m ?? 0,
  precipitation: (data) => data.weather.precipitation ?? 0,
  rain: (data) => data.weather.rain ?? 0,
  weatherCode: (data) => data.weather.weatherCode ?? 0,
  cloudCover: (data) => data.weather.cloudCover ?? 0,
}

export const weatherGetXs: Record<
  WeatherPlottableField,
  (data: Required<WeatherAnalytics>) => Date
> = {
  apparentTemperature: (data) => new Date(data.date),
  temperature2m: (data) => new Date(data.date),
  snowfall: (data) => new Date(data.date),
  snowDepth: (data) => new Date(data.date),
  windSpeed100m: (data) => new Date(data.date),
  windSpeed10m: (data) => new Date(data.date),
  relativeHumidity2m: (data) => new Date(data.date),
  precipitation: (data) => new Date(data.date),
  rain: (data) => new Date(data.date),
  weatherCode: (data) => new Date(data.date),
  cloudCover: (data) => new Date(data.date),
}

const highestTempLabel = (value: number, unit: string) =>
  `Highest Temperature: ${value.toFixed(1)}${unitToLabel(unit)}`

const lowestTempLabel = (value: number, unit: string) =>
  `Lowest Temperature: ${value.toFixed(1)}${unitToLabel(unit)}`

const snowfallLabel = (value: number, unit: string) =>
  `Snowfall: ${value.toFixed(1)}${unitToLabel(unit)}`

const snowDepthLabel = (value: number, unit: string) =>
  `Snow Depth: ${value.toFixed(1)}${unitToLabel(unit)}`

const windSpeedLabel = (value: number, unit: string) =>
  `Wind Speed: ${value.toFixed(1)}${unitToLabel(unit)}`

const relativeHumidityLabel = (value: number, unit: string) =>
  `Relative Humidity: ${value.toFixed(1)}${unitToLabel(unit)}`

const precipitationLabel = (value: number, unit: string) =>
  `Precipitation: ${value.toFixed(1)}${unitToLabel(unit)}`

const rainLabel = (value: number, unit: string) =>
  `Rain: ${value.toFixed(1)}${unitToLabel(unit)}`

const weatherCodeLabel = (value: number) => `Weather Code: ${value}`

const cloudCoverLabel = (value: number, unit: string) =>
  `Cloud Cover: ${value.toFixed(1)}${unitToLabel(unit)}`

export const weatherLineCharts: Record<
  WeatherPlottableField,
  StaticLineData<WeatherAnalytics>
> = {
  apparentTemperature: {
    accessors: {
      getX: weatherGetXs.apparentTemperature,
      getY: weatherGetYs.apparentTemperature,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Apparent Temperature',
      maxLabel: highestTempLabel,
      minLabel: lowestTempLabel,
      unit: 'celsius',
    },
  },
  temperature2m: {
    accessors: {
      getX: weatherGetXs.temperature2m,
      getY: weatherGetYs.temperature2m,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Temperature',
      maxLabel: highestTempLabel,
      minLabel: lowestTempLabel,
      unit: 'celsius',
    },
  },
  snowfall: {
    accessors: {
      getX: weatherGetXs.snowfall,
      getY: weatherGetYs.snowfall,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Snowfall',
      maxLabel: snowfallLabel,
      minLabel: snowfallLabel,
      unit: 'centimeters',
    },
  },
  snowDepth: {
    accessors: {
      getX: weatherGetXs.snowDepth,
      getY: weatherGetYs.snowDepth,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Snow Depth',
      maxLabel: snowDepthLabel,
      minLabel: snowDepthLabel,
      unit: 'centimeters',
    },
  },
  windSpeed100m: {
    accessors: {
      getX: weatherGetXs.windSpeed100m,
      getY: weatherGetYs.windSpeed100m,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Wind Speed at 100m',
      maxLabel: windSpeedLabel,
      minLabel: windSpeedLabel,
      unit: 'kmph',
    },
  },
  windSpeed10m: {
    accessors: {
      getX: weatherGetXs.windSpeed10m,
      getY: weatherGetYs.windSpeed10m,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Wind Speed at 10m',
      maxLabel: windSpeedLabel,
      minLabel: windSpeedLabel,
      unit: 'kmph',
    },
  },
  relativeHumidity2m: {
    accessors: {
      getX: weatherGetXs.relativeHumidity2m,
      getY: weatherGetYs.relativeHumidity2m,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Relative Humidity',
      maxLabel: relativeHumidityLabel,
      minLabel: relativeHumidityLabel,
      unit: 'percentage',
    },
  },
  precipitation: {
    accessors: {
      getX: weatherGetXs.precipitation,
      getY: weatherGetYs.precipitation,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Precipitation',
      maxLabel: precipitationLabel,
      minLabel: precipitationLabel,
      unit: 'millimeter',
    },
  },
  rain: {
    accessors: {
      getX: weatherGetXs.rain,
      getY: weatherGetYs.rain,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Rain',
      maxLabel: rainLabel,
      minLabel: rainLabel,
      unit: 'millimeter',
    },
  },
  weatherCode: {
    accessors: {
      getX: weatherGetXs.weatherCode,
      getY: weatherGetYs.weatherCode,
    },
    config: {
      hasMaxLabel: false,
      hasMinLabel: false,
    },
    labels: {
      description: 'Weather Code',
      maxLabel: weatherCodeLabel,
      minLabel: weatherCodeLabel,
      unit: '',
    },
  },
  cloudCover: {
    accessors: {
      getX: weatherGetXs.cloudCover,
      getY: weatherGetYs.cloudCover,
    },
    config: {
      hasMaxLabel: true,
      hasMinLabel: true,
    },
    labels: {
      description: 'Cloud Cover',
      maxLabel: cloudCoverLabel,
      minLabel: cloudCoverLabel,
      unit: 'percentage',
    },
  },
}

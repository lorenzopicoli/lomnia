import type { HabitAnalytics } from './habitCharts'
import type { WeatherAnalytics } from './weatherCharts'

export enum ChartType {
  LineChart,
}

export enum ChartSource {
  Weather,
  Habit,
}

export type Chart = {
  id: string
  source: ChartSource
  type: ChartType
  title: string
}

export type ChartOption = {
  data: Chart
  value: Chart['id']
  label: string
}

export type ChartsDataSources = WeatherAnalytics | HabitAnalytics

export type StaticLineData<T> = {
  accessors: {
    getX: (data: T) => Date
    getY: (data: T) => number
  }
  config: {
    hasMaxLabel: boolean
    hasMinLabel: boolean
  }
  labels: {
    description?: string
    maxLabel: (value: number, unit: string) => string
    minLabel: (value: number, unit: string) => string
    unit: string
  }
}

export type LineData<T> = {
  id: string
  max?: T
  min?: T
  accessors: {
    getX: (data: T) => Date
    getY: (data: T) => number
  }
  labels: {
    description?: string
    showMaxLabel: boolean
    showMinLabel: boolean
    maxLabel: (value: number, unit: string) => string
    minLabel: (value: number, unit: string) => string
    unit: string
  }
}

export const unitToLabel = (unit: string) => {
  const known: Record<string, string | undefined> = {
    celsius: '°C',
    percentage: '%',
    centimeters: 'cm',
    millimeter: 'mm',
    kmph: 'km/h',
    meters: 'm',
  }
  return known[unit] ?? ''
}

export function getLineData<T>(params: {
  staticLine: StaticLineData<T>
  id: string
  min: T
  max: T
}): LineData<T> {
  const { staticLine, id, max, min } = params
  return {
    ...staticLine,
    id,
    max,
    min,
    labels: {
      ...staticLine.labels,
      showMaxLabel: true,
      showMinLabel: true,
    },
  }
}

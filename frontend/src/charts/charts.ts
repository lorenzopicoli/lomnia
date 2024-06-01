import type { HabitAnalytics } from './habitCharts'
import type { WeatherAnalytics } from './weatherCharts'

export enum ChartType {
  LineChart = 0,
}

export enum ChartSource {
  Weather = 0,
  Habit,
}

export type Chart = {
  id: string
  source: ChartSource
  type: ChartType
  title: string
  // Chart might have a preferred color that was saved
  color?: string
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
  color: string
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

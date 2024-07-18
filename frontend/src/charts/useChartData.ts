import { groupBy } from 'lodash'
import type { ChartType } from './charts'
import { trpc } from '../api/trpc'
import type { GenericChartProps } from '../components/SimpleChart/GenericChartTypes'
import { isNotNill } from '../utils/isNotNil'
import { isDateLike } from '../utils/isDateLike'

const genericXAccessor = (d: { x: string | Date | number }) =>
  isDateLike(d.x) ? new Date(d.x) : d.x

const genericYAccessor = (d: { y: number }) => d.y

export const datumAccessors = {
  genericGetX: genericXAccessor,
  genericGetY: genericYAccessor,
}

/**
 * This hook is reponsible for providing data to charts
 */
export function useChartData(
  chart: {
    id: string
    filters: {
      startDate: Date
      endDate: Date
    }
    config: {
      xKey: string
      aggregation?: {
        period: 'month' | 'day' | 'week'
        fun: 'avg' | 'max' | 'min' | 'median'
      }
      shapes: {
        id: string
        isMain: boolean
        source: 'weather' | 'habit' | 'heartRate'
        yKey: string
        type: ChartType
      }[]
    }
  },
  enabled: boolean
) {
  const sources = groupBy(chart.config.shapes, 'source')
  const habitPayload = {
    startDate: chart.filters.startDate.toISOString(),
    endDate: chart.filters.endDate.toISOString(),
    xKey: chart.config.xKey,
    yKeys: sources.habit?.map((s) => s.yKey) ?? [],
    aggregation: chart.config.aggregation,
  }
  const weatherPayload = {
    startDate: chart.filters.startDate.toISOString(),
    endDate: chart.filters.endDate.toISOString(),
    xKey: chart.config.xKey,
    yKeys: sources.weather?.map((s) => s.yKey) ?? [],
    aggregation: chart.config.aggregation,
  }
  const heartRatePayload = {
    startDate: chart.filters.startDate.toISOString(),
    endDate: chart.filters.endDate.toISOString(),
    xKey: chart.config.xKey,
    yKeys: sources.heartRate?.map((s) => s.yKey) ?? [],
    aggregation: chart.config.aggregation,
  }
  const { data: habitData, isLoading: habitLoading } =
    trpc.getHabitsCharts.useQuery(habitPayload, {
      enabled: enabled && habitPayload.yKeys.length > 0,
    })
  const { data: weatherData, isLoading: weatherLoading } =
    trpc.getWeatherCharts.useQuery(weatherPayload, {
      enabled: enabled && weatherPayload.yKeys.length > 0,
    })
  console.log(heartRatePayload)
  const { data: heartRateData, isLoading: heartRateLoading } =
    trpc.getHeartRateCharts.useQuery(heartRatePayload, {
      enabled: enabled && heartRatePayload.yKeys.length > 0,
    })

  if (habitLoading || weatherLoading || heartRateLoading) {
    return { isLoading: true }
  }

  const mainShape = chart.config.shapes.find((s) => s.isMain)
  const secondaryShapes = chart.config.shapes.filter((s) => !s.isMain) ?? []
  if (!mainShape) {
    throw new Error('Missing main shape')
  }

  const minYs = [
    habitData?.minY,
    weatherData?.minY,
    heartRateData?.minY,
  ].filter(isNotNill)
  const minXs = [
    habitData?.minX,
    weatherData?.minX,
    heartRateData?.minX,
  ].filter(isNotNill)
  const maxYs = [
    habitData?.maxY,
    weatherData?.maxY,
    heartRateData?.maxY,
  ].filter(isNotNill)
  const maxXs = [
    habitData?.maxX,
    weatherData?.maxX,
    heartRateData?.maxX,
  ].filter(isNotNill)

  const minY = Math.min(...minYs)
  const minX =
    minXs.length === 0
      ? 0
      : minXs.reduce((acc, curr) => (acc < curr ? acc : curr))
  const maxY = Math.max(...maxYs)
  const maxX =
    maxXs.length === 0
      ? 0
      : maxXs.reduce((acc, curr) => (acc > curr ? acc : curr))

  const mainChart: GenericChartProps<{ x: string | Date | number; y: number }> =
    {
      id: mainShape.id,
      accessors: {
        getX: datumAccessors.genericGetX,
        getY: datumAccessors.genericGetY,
      },
      type: mainShape.type,
      data:
        habitData?.data[mainShape.yKey] ??
        weatherData?.data[mainShape.yKey] ??
        heartRateData?.data[mainShape.yKey] ??
        [],
      minX,
      maxX,
      minY,
      maxY,
      axis: {
        x: {
          unit: '',
          label: '',
        },
        y: {
          unit: '',
          label: mainShape.yKey,
        },
      },
    }

  const secondaryCharts: GenericChartProps<{
    x: string | Date | number
    y: number
  }>[] = secondaryShapes.map((shape) => ({
    id: shape.id,
    accessors: {
      getX: datumAccessors.genericGetX,
      getY: datumAccessors.genericGetY,
    },
    type: shape.type,
    data:
      habitData?.data[shape.yKey] ??
      weatherData?.data[shape.yKey] ??
      heartRateData?.data[shape.yKey] ??
      [],
    minX,
    maxX,
    minY,
    maxY,
    axis: {
      x: {
        unit: '',
        label: '',
      },
      y: {
        unit: '',
        label: shape.yKey,
      },
    },
  }))

  return { mainChart, secondaryCharts }
}

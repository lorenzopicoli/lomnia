import { ChartType } from '../../charts/charts'
import { type NumberLike } from '@visx/scale'
import type {
  ChartScale,
  ChartScaleBand,
  ChartScaleLinear,
} from '../../charts/types'

export type GenericChartAreaProps<T> = {
  mainChart: GenericChartProps<T>
  secondaryCharts: GenericChartProps<T>[]
  margin?: { top: number; right: number; bottom: number; left: number }
}
export type AxisScaleOutput = number | NumberLike | string | undefined
export type GenericChartProps<T> = {
  id: string
  accessors: {
    getX: (data: T) => string | number | Date
    getY: (data: T) => number
  }
  type: ChartType
  data: T[]
  minX: string | number | Date
  maxX: string | number | Date
  minY: number
  maxY: number
  axis: {
    x: {
      unit: string
      label: string
    }
    y: {
      unit: string
      label: string
    }
  }
}
export type InternalGenericChartProps<T> = GenericChartProps<T> & {
  outerHeight: number
  outerWidth: number
  margin: { left: number; right: number; top: number; bottom: number }
  xScale?: ChartScale
  xBandScale?: ChartScaleBand
  yScale: ChartScaleLinear
}

export type InternalGenericChartAreaProps<T> = GenericChartAreaProps<T> & {
  bgRef: React.LegacyRef<SVGSVGElement>
  width: number
  height: number
}

import { scaleBand, scaleLinear, scaleUtc } from '@visx/scale'
import type { GenericChartProps } from '../components/SimpleChart/GenericChartTypes'
import type { getMaxDomains } from '../components/SimpleChart/utils'
import { isDateLike } from '../utils/isDateLike'
import { isNumber } from '../utils/isNumber'
import type { ChartScale, ChartScaleLinear } from './types'
import { ChartType } from './charts'

export function useChartScales<T>(params: {
  mainChart: GenericChartProps<T>
  height: number
  width: number
  margin: { top: number; right: number; bottom: number; left: number }
  domains: ReturnType<typeof getMaxDomains>
}): { xScale: ChartScale; yScale: ChartScaleLinear } {
  const { mainChart, height, width, margin, domains } = params
  const yScale = {
    type: 'linear' as const,
    scale: scaleLinear({
      domain: [domains.minY, domains.maxY],
      range: [height - margin.bottom - margin.top, 0],
    }),
  }

  // Tries to find the right scale given the data type of the x axis. Might want more control over
  // this in the future
  const xScale =
    mainChart.type === ChartType.BarChart
      ? {
          type: 'band' as const,
          scale: scaleBand({
            domain: mainChart.data.map(mainChart.accessors.getX),
            padding: 0.2,
            range: [margin.left, width - margin.right],
          }),
        }
      : isDateLike(domains.minX)
      ? {
          type: 'utc' as const,
          scale: scaleUtc({
            domain: [new Date(domains.minX), new Date(domains.maxX)],
            range: [margin.left, width - margin.right],
          }),
        }
      : isNumber(domains.maxX) && isNumber(domains.minX)
      ? {
          type: 'linear' as const,
          scale: scaleLinear({
            domain: [domains.minX, domains.maxX],
            range: [margin.left, width - margin.right],
          }),
        }
      : // : mainChart.type === ChartType.BarChart
        {
          type: 'band' as const,
          scale: scaleBand({
            domain: mainChart.data.map(mainChart.accessors.getX),
            padding: 0.2,
            range: [margin.left, width - margin.right],
          }),
        }
  // : scalePoint({
  //     domain: mainChart.data.map(mainChart.accessors.getX),
  //     range: [margin.left, width - margin.right],
  //   })

  // TODO: memoize
  return { xScale, yScale }
}

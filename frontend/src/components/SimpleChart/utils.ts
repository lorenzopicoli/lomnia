import { isNil } from 'lodash'
import type { GenericChartProps } from './GenericChartTypes'
import { scaleBand, scaleLinear, scalePoint, scaleUtc } from '@visx/scale'
import { isDateLike } from '../../utils/isDateLike'
import { isNumber } from '../../utils/isNumber'
import { ChartType } from '../../charts/charts'

export function getMaxDomains<T>(charts: GenericChartProps<T>[]) {
  const domainsInit: {
    minX?: string | number | Date
    maxX?: string | number | Date
    minY?: number
    maxY?: number
  } = {}
  const domains = charts.reduce(
    (acc, curr) => ({
      minX: isNil(acc.minX)
        ? curr.minX
        : acc.minX > curr.minX
        ? curr.minX
        : acc.minX,
      maxX: isNil(acc.maxX)
        ? curr.maxX
        : acc.maxX < curr.maxX
        ? curr.maxX
        : acc.maxX,
      minY: isNil(acc.minY)
        ? curr.minY
        : acc.minY > curr.minY
        ? curr.minY
        : acc.minY,
      maxY: isNil(acc.maxY)
        ? curr.maxY
        : acc.maxY < curr.maxY
        ? curr.maxY
        : acc.maxY,
    }),
    domainsInit
  )
  if (
    isNil(domains.maxX) ||
    isNil(domains.maxY) ||
    isNil(domains.minY) ||
    isNil(domains.minX)
  ) {
    throw new Error('Invalid chart domains')
  }
  return domains as {
    minX: string | number | Date
    maxX: string | number | Date
    minY: number
    maxY: number
  }
}

export function useChartScales<T>(params: {
  mainChart: GenericChartProps<T>
  height: number
  width: number
  margin: { top: number; right: number; bottom: number; left: number }
  domains: ReturnType<typeof getMaxDomains>
}) {
  const { mainChart, height, width, margin, domains } = params
  const yScale = scaleLinear({
    domain: [domains.minY, domains.maxY],
    range: [height - margin.bottom - margin.top, 0],
  })

  // Tries to find the right scale given the data type of the x axis. Might want more control over
  // this in the future
  const xScale = isDateLike(domains.minX)
    ? scaleUtc({
        domain: [new Date(domains.minX), new Date(domains.maxX)],
        range: [margin.left, width - margin.right],
      })
    : isNumber(domains.maxX) && isNumber(domains.minX)
    ? scaleLinear({
        domain: [domains.minX, domains.maxX],
        range: [margin.left, width - margin.right],
      })
    : mainChart.type === ChartType.BarChart
    ? scaleBand({
        domain: mainChart.data.map(mainChart.accessors.getX),
        padding: 0.2,
        range: [margin.left, width - margin.right],
      })
    : scalePoint({
        domain: mainChart.data.map(mainChart.accessors.getX),
        range: [margin.left, width - margin.right],
      })

  // TODO: memoize
  return { xScale, yScale }
}

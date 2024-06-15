import { isNil } from 'lodash'
import type { GenericChartProps } from './GenericChartTypes'

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

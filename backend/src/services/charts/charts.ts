import type { PgColumn } from 'drizzle-orm/pg-core'
import {
  aggregationPeriods,
  type ChartServiceParams,
  type ChartServiceReturn,
} from './types'
import { avg, max, min, sql, type SQL } from 'drizzle-orm'
import { isNil } from 'lodash'

// TODO: Slow
export function getMinMaxChart(
  data: Record<string, { x: number | Date | string; y: number }[]>
): Awaited<ChartServiceReturn> {
  const keys = Object.keys(data)
  let minX: string | number | Date | undefined
  let minY: number | undefined
  let maxX: string | number | Date | undefined
  let maxY: number | undefined

  for (const key of keys) {
    const keyData = data[key]
    for (const { x, y } of keyData) {
      if (isNil(minX)) {
        minX = x
      }
      if (isNil(minY)) {
        minY = y
      }
      if (isNil(maxX)) {
        maxX = x
      }
      if (isNil(maxY)) {
        maxY = y
      }

      if (x < minX!) {
        minX = x
      }
      if (y < minY!) {
        minY = y
      }
      if (x > maxX!) {
        maxX = x
      }
      if (y > maxY!) {
        maxY = y
      }
    }
  }

  return { minX: minX!, minY: minY!, maxX: maxX!, maxY: maxY!, data }
}

export function getAggregatedYColumn(
  col: PgColumn | SQL,
  aggregation?: ChartServiceParams['aggregation']
): SQL {
  if (!aggregation) {
    return sql`${col}`
  }

  switch (aggregation.fun) {
    case 'avg':
      return avg(col)
    case 'median':
      return avg(col)
    case 'max':
      return max(col)
    case 'min':
      return min(col)
  }
}

export function getAggregatedXColumn(
  col: PgColumn,
  aggregation?: ChartServiceParams['aggregation']
): SQL {
  if (!aggregation) {
    return sql`${col}`
  }

  // Protect against sql injection
  if (aggregationPeriods.indexOf(aggregation.period) === -1) {
    return sql`${col}`
  }

  // Need to use SQL raw so the period isn't a parameter. By doing this psql knows that
  // the selection/order/group are all the same expression
  return sql`DATE_TRUNC('${sql.raw(aggregation.period)}', ${col})`
}

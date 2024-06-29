import { asc, sql, type SQL } from 'drizzle-orm'
import { getKeys } from '../helpers/getKeys'
import {
  heartRateReadingsTable,
  type HeartRateReadingColumns,
} from '../models/HeartRateReading'
import {
  getAggregatedXColumn,
  getAggregatedYColumn,
  getMinMaxChart,
} from './charts/charts'
import type { ChartServiceParams, ChartServiceReturn } from './charts/types'
import { db } from '../db/connection'

export const getHeartRateCharts = async (
  params: ChartServiceParams
): ChartServiceReturn => {
  const { yKeys, xKey, filters, aggregation } = params
  const columns = getKeys(heartRateReadingsTable)
  const isSafeXKey = columns.includes(xKey as (typeof columns)[number])
  const isSafeYKeys = yKeys.every((yKey) =>
    columns.includes(yKey as (typeof columns)[number])
  )

  if (!isSafeXKey || !isSafeYKeys) {
    console.log('X', isSafeXKey, 'Y', isSafeYKeys)
    console.log('X', xKey, 'Y', yKeys)
    throw new Error('Invalid keys')
  }
  const xKeyTyped = xKey as HeartRateReadingColumns
  const yKeysTyped = yKeys as HeartRateReadingColumns[]
  const xCol = getAggregatedXColumn(
    heartRateReadingsTable[xKeyTyped],
    aggregation
  )
  const yCols = yKeysTyped.reduce((acc, curr) => {
    acc[curr] = getAggregatedYColumn(
      heartRateReadingsTable[curr],
      aggregation
    ).mapWith(Number)
    return acc
  }, {} as Record<HeartRateReadingColumns, SQL>)

  const data = db
    .select({
      ...yCols,
      [xKey]: xCol,
    })
    .from(heartRateReadingsTable)
    .where(
      sql`
      ${
        heartRateReadingsTable.startTime
      } >= (${filters.startDate.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${
        heartRateReadingsTable.startTime
      } <= (${filters.endDate.toISO()} AT TIME ZONE 'America/Toronto')::date`
    )
    .$dynamic()

  if (aggregation) {
    data.groupBy(sql`${xCol}`)
  }

  data.orderBy(asc(xCol))
  const result = await data
  const formatted: Record<string, { x: number | Date | string; y: number }[]> =
    {}

  // Slow!
  for (const entry of result) {
    const x = entry[xKeyTyped] as string | number
    for (const key of getKeys(entry)) {
      if (key === xKeyTyped) {
        continue
      }
      if (!formatted[key]) {
        formatted[key] = []
      }
      formatted[key].push({ x, y: entry[key] as number })
    }
  }

  return getMinMaxChart(formatted)
}

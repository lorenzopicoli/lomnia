import { type ExtractTablesWithRelations, sql } from 'drizzle-orm'
import { customType } from 'drizzle-orm/pg-core'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import * as wkx from 'wkx'
import type * as schema from './schema'

export interface Point {
  lat: number
  lng: number
}

export const geography = customType<{ data: Point }>({
  dataType() {
    return 'geography'
  },

  toDriver(data: Point) {
    return `SRID=4326;POINT(${data.lng} ${data.lat})`
  },

  fromDriver(data: unknown) {
    const wkbBuffer = Buffer.from(data as string, 'hex')
    const parsed = wkx.Geometry.parse(wkbBuffer) as wkx.Point

    return {
      lng: parsed.x,
      lat: parsed.y,
    }
  },
})

export type DBTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

/**
 * Replaces the default jsonb type. Needed because of a drizzle bug:
 * https://github.com/drizzle-team/drizzle-orm/pull/666
 * https://github.com/drizzle-team/drizzle-orm/pull/1641
 */
export const customJsonb = <TData>(name: string) =>
  customType<{ data: TData; driverData: TData }>({
    dataType() {
      return 'jsonb'
    },
    toDriver(val: TData) {
      return sql`(((${JSON.stringify(val)})::jsonb)#>> '{}')::jsonb`
    },
    fromDriver(value): TData {
      return value as TData
    },
  })(name)

import { customType } from 'drizzle-orm/pg-core'
import * as wkx from 'wkx'

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
      lat: parsed.x,
      lng: parsed.y,
    }
  },
})

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as wkx from "wkx";
import type * as schema from "../models";

export interface Point {
  lat: number;
  lng: number;
}

export function toPostgisGeoPoint(data: Point) {
  return `SRID=4326;POINT(${data.lng} ${data.lat})`;
}

export const geography = customType<{ data: Point }>({
  dataType() {
    return "geography";
  },

  toDriver(data: Point) {
    return toPostgisGeoPoint(data);
  },

  fromDriver(data: unknown) {
    const wkbBuffer = Buffer.from(data as string, "hex");
    const parsed = wkx.Geometry.parse(wkbBuffer) as wkx.Point;

    return {
      lng: parsed.x,
      lat: parsed.y,
    };
  },
});

type Coordinate = [number, number];

interface GeoJson {
  type: string;
  coordinates: Coordinate[][];
}

export const polygon = customType<{ data: Coordinate[][]; driverData: string }>({
  dataType() {
    return "geometry(Polygon, 4326)";
  },
  toDriver(coordinates: Coordinate[][]): string {
    return JSON.stringify({
      type: "Polygon",
      coordinates,
    });
  },
  fromDriver(data: string) {
    const geoJson = wkx.Geometry.parse(Buffer.from(data, "hex")).toGeoJSON() as GeoJson;

    return geoJson.coordinates;
  },
});

export type DBTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

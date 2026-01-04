import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/connection";
import type { Point } from "../db/types";
import { locationsTable } from "../models/Location";
import { locationDetailsTable } from "../models/LocationDetails";
import { type PlaceOfInterest, placesOfInterestTable } from "../models/PlaceOfInterest";
import { type PolygonFeature, PolygonFeatureSchema } from "../types/polygon";
import { PlaceSchema } from "./reverseGeocode/nominatimSchema";

export type PlaceOfInterestWithLocation = PlaceOfInterest & {
  locationDetails: typeof locationDetailsTable.$inferSelect;
};

export const PlaceOfInterestInputSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  address: PlaceSchema,
  polygon: PolygonFeatureSchema,
});
export type PlaceOfInterestInput = z.infer<typeof PlaceOfInterestInputSchema>;

export namespace PlaceOfInterestService {
  export async function byId(id: number): Promise<PlaceOfInterestWithLocation | undefined> {
    const result = await db
      .select({
        poi: placesOfInterestTable,
        locationDetails: locationDetailsTable,
      })
      .from(placesOfInterestTable)
      .innerJoin(locationDetailsTable, eq(placesOfInterestTable.locationDetailsId, locationDetailsTable.id))
      .where(eq(placesOfInterestTable.id, id))
      .then((r) => r[0]);

    if (!result) return undefined;

    return {
      ...result.poi,
      locationDetails: result.locationDetails,
    };
  }

  export async function getTableData(params: { limit: number; page: number; search?: string }) {
    const { limit, page, search } = params;
    const searchQuery = `%${search}%`;

    const whereClause = !search ? sql`1=1` : sql`${placesOfInterestTable.name} ILIKE ${searchQuery}`;

    const baseQuery = db
      .select({
        id: placesOfInterestTable.id,
        name: placesOfInterestTable.name,
        createdAt: placesOfInterestTable.createdAt,
        city: locationDetailsTable.city,
        country: sql`
  ${locationDetailsTable.country}
  || ' ('
  || ${locationDetailsTable.countryCode}
  || ')'
`.mapWith(String),
      })
      .from(placesOfInterestTable)
      .innerJoin(locationDetailsTable, eq(placesOfInterestTable.locationDetailsId, locationDetailsTable.id))
      .where(whereClause)
      .$dynamic();

    const [entries, [{ count }]] = await Promise.all([
      baseQuery
        .orderBy(desc(placesOfInterestTable.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),

      db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(placesOfInterestTable)
        .where(whereClause),
    ]);

    return {
      entries,
      total: Number(count),
      page,
      limit,
    };
  }

  export async function create(data: PlaceOfInterestInput): Promise<number> {
    const locationDetailsId = await saveLocationDetails(data);
    const result = await db
      .insert(placesOfInterestTable)
      .values({
        name: data.name,
        locationDetailsId,
        geoJson: data.polygon,
        polygon: data.polygon.geometry.coordinates,
        createdAt: new Date(),
      })
      .returning({ id: placesOfInterestTable.id });

    return result[0].id;
  }

  export async function update(id: number, data: PlaceOfInterestInput): Promise<void> {
    // TODO: should it create a new entry or not?
    const locationDetailsId = await saveLocationDetails(data);
    await db
      .update(placesOfInterestTable)
      .set({
        name: data.name,
        locationDetailsId,
        geoJson: data.polygon,
        polygon: data.polygon.geometry.coordinates,
        updatedAt: new Date(),
      })
      .where(eq(placesOfInterestTable.id, id));
  }

  export async function deletePoi(id: number): Promise<void> {
    await db.delete(placesOfInterestTable).where(eq(placesOfInterestTable.id, id));
  }

  export async function getCount(): Promise<number> {
    const [{ count }] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(placesOfInterestTable);

    return count;
  }

  export async function getLocationsCount(): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql`COUNT(DISTINCT ${locationsTable.id})`.mapWith(Number) })
      .from(placesOfInterestTable)
      .innerJoin(locationDetailsTable, eq(placesOfInterestTable.locationDetailsId, locationDetailsTable.id))
      .innerJoin(locationsTable, eq(locationDetailsTable.id, locationsTable.locationDetailsId));

    return count;
  }

  export function getPlaceOfInterestCenter(polygon: PolygonFeature): Point {
    const ring = polygon.geometry.coordinates[0];

    // Remove duplicate closing point if it exists
    const points =
      ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring;

    let lngSum = 0;
    let latSum = 0;

    for (const [lng, lat] of points) {
      lngSum += lng;
      latSum += lat;
    }

    return { lng: lngSum / points.length, lat: latSum / points.length };
  }

  async function saveLocationDetails(data: PlaceOfInterestInput): Promise<number> {
    const locationDetails = await db
      .insert(locationDetailsTable)
      .values({
        ...data.address,
        source: "userPOIJson",
        location: getPlaceOfInterestCenter(data.polygon),
      })
      .returning({ id: locationDetailsTable.id });
    return locationDetails[0].id;
  }
}

import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { locationsTable } from "../models/Location";
import { locationDetailsTable } from "../models/LocationDetails";
import { type PlaceOfInterest, placesOfInterestTable } from "../models/PlaceOfInterest";

export type PlaceOfInterestWithLocation = PlaceOfInterest & {
  locationDetails: Pick<
    typeof locationDetailsTable.$inferSelect,
    "id" | "name" | "city" | "country" | "road" | "displayName"
  >;
};

export type PlaceOfInterestInput = {
  name: string;
  locationDetailsId: number;
  geoJson: Record<string, unknown>;
};

export namespace PlaceOfInterestService {
  export async function byId(id: number): Promise<PlaceOfInterestWithLocation | undefined> {
    const result = await db
      .select({
        poi: placesOfInterestTable,
        locationDetails: {
          id: locationDetailsTable.id,
          name: locationDetailsTable.name,
          city: locationDetailsTable.city,
          country: locationDetailsTable.country,
          road: locationDetailsTable.road,
          displayName: locationDetailsTable.displayName,
        },
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
        locationDetailsId: placesOfInterestTable.locationDetailsId,
      })
      .from(placesOfInterestTable)
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
    const result = await db
      .insert(placesOfInterestTable)
      .values({
        name: data.name,
        locationDetailsId: data.locationDetailsId,
        geoJson: data.geoJson,
        polygon: sql`ST_GeomFromGeoJSON(${JSON.stringify(data.geoJson)})`,
        createdAt: new Date(),
      })
      .returning({ id: placesOfInterestTable.id });

    return result[0].id;
  }

  export async function update(id: number, data: PlaceOfInterestInput): Promise<void> {
    await db
      .update(placesOfInterestTable)
      .set({
        name: data.name,
        locationDetailsId: data.locationDetailsId,
        geoJson: data.geoJson,
        polygon: sql`ST_GeomFromGeoJSON(${JSON.stringify(data.geoJson)})`,
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
}

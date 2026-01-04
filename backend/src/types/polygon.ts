import z from "zod";

/**
 * [lng, lat]
 */
export const PositionSchema = z.tuple([
  z.number(), // lng
  z.number(), // lat
]);

/**
 * Polygon geometry
 */
export const PolygonGeometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(
    z
      .array(PositionSchema)
      .min(4), // closed ring (first == last) not enforced here
  ),
});

/**
 * GeoJSON Feature (single polygon)
 */
export const PolygonFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: z.record(z.never(), z.never()),
  geometry: PolygonGeometrySchema,
});

export type PolygonFeature = z.infer<typeof PolygonFeatureSchema>;

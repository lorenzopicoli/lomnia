/**
 * [lng, lat]
 */
export type Position = [number, number];

export type PolygonFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: {
    type: "Polygon";
    coordinates: Position[][];
  };
};

export type ReadonlyPolygon = { name: string; feature: PolygonFeature };

export type LocationArray = [longitude: number, latitude: number];
export type ThreeLocationArray = [longitude: number, latitude: number, other: number];
// This shouldn't happen here, the backend should return the bounds for the given period
export function findBounds(points: ThreeLocationArray[]): { topLeft: [number, number]; bottomRight: [number, number] };
export function findBounds(points: LocationArray[]): { topLeft: [number, number]; bottomRight: [number, number] };
export function findBounds(points: LocationArray[] | ThreeLocationArray[]): {
  topLeft: [number, number];
  bottomRight: [number, number];
} {
  if (points.length === 0) {
    throw new Error("Points list cannot be empty");
  }

  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];

  for (const point of points) {
    const [lng, lat] = point;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const topLeft: [number, number] = [minLng, maxLat];
  const bottomRight: [number, number] = [maxLng, minLat];

  return { topLeft, bottomRight };
}

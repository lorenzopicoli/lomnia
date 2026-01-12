import { DateTime } from "luxon";
import type { Point } from "../db/types";
import { delay } from "../helpers/delay";
import { Nominatim } from "../services/nominatim/Nominatim";
import { PlaceOfInterestService } from "../services/placeOfInterest";
import type { PolygonFeature } from "../types/polygon";
import { mapNominatimApiResponseToPlace } from "../services/reverseGeocode/nominatimSchema";

/*
 * ------------------------------------
 * Small script to convert my old JSON POI entries into
 * database entries. To run it modify some file to call
 * this function with the POI array
 * ------------------------------------
 */

export type LocationInput = {
  name: string;
  displayName?: string;
  lat: number;
  lng: number;
  radiusInMeters: number;
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  county?: string;
  region?: string;
  state?: string;
  ISO3166_2_lvl4?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
};

export type ImportResult = {
  name: string;
  poiId: number;
};

/**
 * Convert a circle (center + radius) to a GeoJSON Polygon Feature.
 * Uses simple trigonometric approximation.
 */
export function circleToPolygonFeature(
  lat: number,
  lng: number,
  radiusInMeters: number,
  points: number = 32,
): PolygonFeature {
  const coordinates: [number, number][] = [];

  // Convert radius to degrees (approximate)
  // 1 degree ≈ 111,320 meters at equator
  const angularRadius = radiusInMeters / 111320;

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;

    // Calculate offset from center
    const dLat = angularRadius * Math.cos(angle);
    const dLng = (angularRadius * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);

    const pointLat = lat + dLat;
    const pointLng = lng + dLng;

    // GeoJSON uses [lng, lat] format
    coordinates.push([pointLng, pointLat]);
  }

  // Close the polygon by adding the first point at the end
  coordinates.push(coordinates[0]);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}

/**
 * Import places of interest from location data with circles.
 *
 * @param locations Array of location objects with circle definitions
 * @returns Array of import results with POI IDs
 */
export async function importPlacesOfInterestFromLocations(locations: LocationInput[]): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  for (const location of locations) {
    // Convert circle to polygon
    const polygon = circleToPolygonFeature(location.lat, location.lng, location.radiusInMeters);

    // Reverse geocode the center point
    const centerPoint: Point = { lat: location.lat, lng: location.lng };
    const nominatim = new Nominatim();
    const { response } = await nominatim.reverseGeocode({
      location: centerPoint,
      when: DateTime.utc(),
    });
    const address = mapNominatimApiResponseToPlace(response);

    // Create the place of interest
    const poiId = await PlaceOfInterestService.create({
      name: location.name,
      address: { ...address, displayName: location.displayName },
      polygon,
    });

    results.push({
      name: location.name,
      poiId,
    });
    console.log("Done poi", location);
    await delay(1000);
  }

  return results;
}

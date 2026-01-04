import axios from "axios";
import config from "../../config";
import type { Point } from "../../db/types";
import { Logger } from "../Logger";
import {
  mapNominatimApiResponseToPlace,
  type NominatimReverseResponse,
  NominatimReverseResponseSchema,
} from "./nominatimSchema";

/**
 * Reverse-geocode a lat/lng and format the response into a unified object.
 */
export async function reverseGeocode(point: Point) {
  const logger = new Logger("ReverseGeocode");
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        format: "json",
        zoom: 18,
        namedetails: 1,
        extratags: 1,
        lat: point.lat,
        lon: point.lng,
      },
      headers: { "User-Agent": config.importers.locationDetails.nominatim.userAgent },
    });

    const parsed: NominatimReverseResponse = NominatimReverseResponseSchema.parse(response.data);

    return mapNominatimApiResponseToPlace(parsed);
  } catch (err) {
    logger.error(`Failed to reverse-geocode lat=${point.lat}, lng=${point.lng}: ${String(err)}`);
    throw err;
  }
}

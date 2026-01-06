import axios from "axios";
import { DateTime } from "luxon";
import config from "../../config";
import type { Point } from "../../db/types";
import { NominatimCache } from "../cache/NominatimCache";
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
    const apiCallsParams = {
      format: "json",
      zoom: 18,
      namedetails: 1,
      extratags: 1,
      lat: point.lat,
      lon: point.lng,
    };
    const cache = NominatimCache.init();

    const cachedResponse = await cache.get(apiCallsParams, DateTime.utc());

    if (cachedResponse) {
      logger.debug("Found cached response");
    }

    const response = cachedResponse
      ? cachedResponse.response
      : await axios
          .get("https://nominatim.openstreetmap.org/reverse", {
            params: apiCallsParams,
            headers: { "User-Agent": config.importers.locationDetails.nominatim.userAgent },
          })
          .then((r) => r.data);

    if (!cachedResponse) {
      logger.debug("Called nominatim because couldn't find cache");
      await cache.set({
        request: apiCallsParams,
        response,
        eventAt: DateTime.utc(),
        fetchedAt: DateTime.utc(),
      });
    }

    const parsed: NominatimReverseResponse = NominatimReverseResponseSchema.parse(response);

    return mapNominatimApiResponseToPlace(parsed);
  } catch (err) {
    logger.error(`Failed to reverse-geocode lat=${point.lat}, lng=${point.lng}: ${String(err)}`);
    throw err;
  }
}

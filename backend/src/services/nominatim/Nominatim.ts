import axios, { type AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { DateTime } from "luxon";
import config from "../../config";
import type { Point } from "../../db/types";
import { Logger } from "../Logger";
import { NominatimCache } from "./NominatimCache";

export class Nominatim {
  static apiUrl = "https://nominatim.openstreetmap.org/";
  private http: AxiosInstance;
  private cache = NominatimCache.init();
  protected logger = new Logger("NominatimAPI");

  constructor(logger?: Logger) {
    const http = axios.create({
      baseURL: Nominatim.apiUrl,
      headers: { "User-Agent": config.nominatim.userAgent },
    });

    axiosRetry(http, { retries: 3, retryDelay: axiosRetry.linearDelay(1000) });
    this.http = http;
    if (logger) {
      this.logger = logger;
    }
  }

  /**
   * Reverse geocode a point that was recorded at a certain time. The
   * certain time is important for caching
   */
  public async reverseGeocode(params: { location: Point; when: DateTime }) {
    const { location, when } = params;
    const apiCallParams = {
      format: "json",
      zoom: 18,
      namedetails: 1,
      extratags: 1,
      lat: location.lat,
      lon: location.lng,
    };
    const cached = when
      ? await this.cache.get(apiCallParams, {
          eventAt: when,
          location,
        })
      : null;

    if (cached) {
      this.logger.debug("Cache hit for location", { apiCallParams, when });
      return { isCached: true, validFrom: cached.validFrom, validTo: cached.validTo, response: cached.response };
    }

    this.logger.debug("Cache miss, calling Nominatim API for params", { apiCallParams, when });
    const response = await this.http
      .get("/reverse", {
        params: apiCallParams,
      })
      .then((r) => r.data);

    const cacheEntry = await this.cache.set({
      response: { apiResponse: response },
      eventAt: when,
      fetchedAt: DateTime.utc(),
      location,
      request: apiCallParams,
    });

    return {
      isCached: false,
      cacheEntry,
      validFrom: when.minus({ hour: 1 }),
      validTo: when.plus({ days: 7 }),
      response,
    };
  }

  /**
   * Geocode a place by free-form text (forward geocoding).
   */
  public async geocode(params: { query: string; limit?: number }) {
    const { query, limit = 5 } = params;

    const apiCallParams = {
      format: "json",
      q: query,
      limit,
      addressdetails: 1,
      namedetails: 1,
      extratags: 1,
    };

    this.logger.debug("Calling Nominatim geocode API", { apiCallParams });

    const response = await this.http
      .get("/search", {
        params: apiCallParams,
      })
      .then((r) => r.data);

    console.log(response);
    const lat = response?.[0]?.lat;
    const lng = response?.[0]?.lon;
    if (!lat || !lng) {
      return null;
    }
    return {
      lat,
      lng,
    };
  }
}

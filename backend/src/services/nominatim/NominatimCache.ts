import { latLngToCell } from "h3-js";
import config from "../../config";
import { TimeAwareCache } from "../cache/TimeAwareCache";

interface NominatimCacheRequest {
  format: string;
  zoom: number;
  namedetails: number;
  extratags: number;
  lat: number;
  lon: number;
}
interface NominatimCacheKeyParams {
  format: string;
  zoom: number;
  namedetails: number;
  extratags: number;
  h3Index: string;
}

/**
 * A subclass of TimeAwareCache which makes it so for nominatim calls, the cacheKey uses an h3 index instead of the lat/lng pair
 * Which should give some spatial leeway when trying to hit the cache. This is important for Nominatim because of their strong rate limits
 * and it also speeds up replaying/recalculating location details. On top of that, it keeps track of historical addresses if they change
 * https://h3geo.org/
 */
export class NominatimCache extends TimeAwareCache<any, NominatimCacheRequest, NominatimCacheKeyParams> {
  private h3Resolution = config.cache.nominatim.h3Resolution;
  private static instance: NominatimCache | undefined = undefined;
  private constructor() {
    super({
      bucket: config.cache.s3Bucket,
      timeWindowInDays: config.cache.nominatim.timeWindowInDays,
      provider: "nominatim",
    });
  }

  static init() {
    if (NominatimCache.instance) {
      return NominatimCache.instance;
    }
    NominatimCache.instance = new NominatimCache();
    return NominatimCache.instance;
  }

  protected getCacheKeyParams(request: NominatimCacheRequest): NominatimCacheKeyParams {
    return {
      format: request.format,
      zoom: request.zoom,
      namedetails: request.namedetails,
      extratags: request.extratags,
      h3Index: latLngToCell(request.lat, request.lon, this.h3Resolution),
    };
  }
}

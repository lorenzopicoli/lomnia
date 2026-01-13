import config from "../../config";
import { LocationDateCache } from "../cache/LocationDateCache";

interface NominatimCacheRequest {
  format: string;
  zoom: number;
  namedetails: number;
  extratags: number;
  lat: number;
  lon: number;
}
/**
 * Omit lat and lng since they shouldn't be accounted for the cache key, they are handled by the index table
 */
type NominatimCacheKeyParams = Omit<NominatimCacheRequest, "lat" | "lon">;

/**
 * A subclass of LocationDateCache which makes it so for nominatim calls, which properly caches Nominatim API calls
 */
export class NominatimCache extends LocationDateCache<unknown, NominatimCacheRequest, NominatimCacheKeyParams> {
  private static instance: NominatimCache | undefined = undefined;
  private constructor() {
    super({
      bucket: config.cache.s3Bucket,
      timeWindowInSeconds: config.cache.nominatim.timeWindowInSeconds,
      locationWindowInMeters: config.cache.nominatim.locationWindowInMeters,
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
    };
  }
}

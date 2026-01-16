import config from "../../config";
import { LocationDateCache } from "../cache/LocationDateCache";
import type { OpenMeteoApiDailyParams, OpenMeteoApiHourlyParams } from "./OpenMeteoTypes";

interface OpenMeteoCacheRequest extends OpenMeteoApiDailyParams, OpenMeteoApiHourlyParams {
  apiVersion: string;
}
/**
 * Omit lat, lng and dates since they shouldn't be accounted for the cache key, they are handled by the index table
 */
type OpenMeteoCacheKeyParams = Omit<OpenMeteoCacheRequest, "latitude" | "longitude" | "start_date" | "end_date">;

/**
 * A subclass of LocationDateCache which makes it so for OpenMeteo calls, which properly caches OpenMeteo API calls
 */
export class OpenMeteoCache extends LocationDateCache<unknown, OpenMeteoCacheRequest, OpenMeteoCacheKeyParams> {
  private static instance: OpenMeteoCache | undefined = undefined;
  private constructor() {
    super({
      bucket: config.cache.s3Bucket,
      timeWindowInSeconds: config.cache.openMeteo.timeWindowInSeconds,
      locationWindowInMeters: config.cache.openMeteo.locationWindowInMeters,
      provider: "openMeteo",
    });
  }

  static init() {
    if (OpenMeteoCache.instance) {
      return OpenMeteoCache.instance;
    }
    OpenMeteoCache.instance = new OpenMeteoCache();
    return OpenMeteoCache.instance;
  }

  protected getCacheKeyParams(request: OpenMeteoCacheRequest): OpenMeteoCacheKeyParams {
    return {
      timeformat: request.timeformat,
      apiVersion: request.apiVersion,
      hourly: request.hourly,
      daily: request.daily,
      timezone: request.timezone,
    };
  }
}

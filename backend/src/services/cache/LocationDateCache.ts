import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import type { Point } from "../../db/types";
import { locationDateCacheIndexTable } from "../../models/LocationDateCacheIndex";
import { Logger } from "../Logger";
import { S3 } from "../S3";

export interface CacheEntry<Response, Request> {
  response: Response;
  request: Request;
  metadata: {
    cachedAt: string;
    /**
     * When the event that is being cached happened
     */
    eventAt: string;
    /**
     * The location that is attached to this request
     */
    location: Point;
  };
}

/**
 * Store JSON blobs in a way that the cache is replayable for any period in time
 */
export abstract class LocationDateCache<Response, Request, CacheKeyParams = Request> {
  // TODO: might be a good idea to also have a local cache layer for fast replays?
  // private localCache: Map<string, NominatimCacheEntry> = new Map();
  private s3: S3;
  private logger = new Logger("LocationDateCache");
  private bucket: string;
  private provider: string;
  /**
   * For how long before/after the event date is the cache valid for
   */
  private timeWindowInSeconds: number;
  /**
   * How far can the original location be for it to still be a hit?
   */
  private locationWindowInMeters: number;

  constructor(params: {
    bucket: string;
    provider: string;
    timeWindowInSeconds: number;
    locationWindowInMeters: number;
  }) {
    this.s3 = S3.init();
    this.bucket = params.bucket;
    this.timeWindowInSeconds = params.timeWindowInSeconds;
    this.locationWindowInMeters = params.locationWindowInMeters;
    this.provider = params.provider;
  }

  /**
   * Get cached response for a request
   * @returns Cached response if found and not expired, null otherwise
   */
  async get(
    request: Request,
    params: {
      location: Point;
      eventAt: DateTime;
    },
  ): Promise<CacheEntry<Response, Request> | null> {
    const { location, eventAt } = params;
    try {
      const cacheKey = this.getCacheKey(request);
      const point = sql`
        ST_SetSRID(
          ST_MakePoint(${location.lng}, ${location.lat}),
          4326
        )::geography
      `;
      const entry = await db
        .select()
        .from(locationDateCacheIndexTable)
        .where(
          and(
            eq(locationDateCacheIndexTable.provider, this.provider),
            eq(locationDateCacheIndexTable.cacheKey, cacheKey),
            lte(locationDateCacheIndexTable.validFrom, eventAt.toJSDate()),
            gte(locationDateCacheIndexTable.validTo, eventAt.toJSDate()),
            sql`ST_DWithin(
              ${locationDateCacheIndexTable.location},
              ${point},
              ${this.locationWindowInMeters}
            )`,
          ),
        )
        // Get the one that is the closest to the event date
        .orderBy(sql`ABS(EXTRACT(EPOCH FROM (${locationDateCacheIndexTable.eventAt} - ${eventAt.toISO()})))`)
        .limit(1)
        .then((r) => r[0] ?? null);
      if (!entry) {
        return null;
      }
      let filePath: string | undefined;

      try {
        filePath = await this.s3.downloadTmp(this.bucket, entry.s3Key);

        const gzipped = fs.readFileSync(filePath);
        const json = gunzipSync(gzipped).toString("utf8");

        return JSON.parse(json) as CacheEntry<Response, Request>;
      } finally {
        if (filePath) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      this.logger.debug("Cache miss (S3 error)", { error });
      return null;
    }
  }

  /**
   * Store response in cache
   * @param params.request the request that was made to the external service. The subclass can "clean up" what gets
   * used for the cache key by implementing getCacheKeyParams
   * @param params.response either the external service's raw response to be stored or an existing s3 key if the goal is
   * to link the new request to a pre-existing response
   * @param params.location the location related to the data being saved
   * @param params.eventAt the date related to the data being saved
   *
   * @returns the s3 key or null if failed to insert it
   */
  async set(params: {
    request: Request;
    response: { apiResponse?: Response; existingS3Key?: string };
    eventAt: DateTime;
    location: Point;
    fetchedAt: DateTime;
  }): Promise<string | null> {
    const { request, response, eventAt, fetchedAt, location } = params;
    this.logger.debug("Setting locationDate cache", { eventAt, location, fetchedAt });

    if (!response.apiResponse && !response.existingS3Key) {
      this.logger.error("Must specify apiResponse or existingS3key", { params });
      throw new Error("Must specify apiResponse or existingS3key");
    }
    if (response.apiResponse && response.existingS3Key) {
      this.logger.error("Must specify only one apiResponse or existingS3key", { params });
      throw new Error("Must specify only one apiResponse or existingS3key");
    }

    const s3Key = response.existingS3Key ? response.existingS3Key : this.getS3Key();
    const cacheKey = this.getCacheKey(request);
    const eventAtIso = eventAt.toISO();

    if (!eventAtIso) {
      this.logger.error("Failed to fetch eventAtIso", { cacheKey, request });
      return null;
    }

    try {
      if (response.apiResponse) {
        const cacheEntry: CacheEntry<Response, Request> = {
          response: response.apiResponse,
          request,
          metadata: {
            cachedAt: DateTime.utc().toISO(),
            eventAt: eventAtIso,
            location,
          },
        };
        const gzipped = gzipSync(JSON.stringify(cacheEntry));
        await this.s3.uploadGzip(this.bucket, s3Key, gzipped);
      }
      await db.insert(locationDateCacheIndexTable).values({
        cacheKey,
        provider: this.provider,
        s3Key,
        validFrom: eventAt.minus({ seconds: this.timeWindowInSeconds }).toJSDate(),
        validTo: eventAt.plus({ seconds: this.timeWindowInSeconds }).toJSDate(),
        fetchedAt: fetchedAt.toJSDate(),
        eventAt: eventAt.toJSDate(),
        location,

        createdAt: new Date(),
      });
    } catch (e) {
      this.logger.error("Failed to save cache entry", e);
    }

    return s3Key;
  }

  /**
   * Get a random S3 key
   */
  private getS3Key(): string {
    return `cache/${this.provider}/${crypto.randomUUID()}.json.gz`;
  }

  protected abstract getCacheKeyParams(request: Request): CacheKeyParams;

  protected getCacheKey(request: Request) {
    const keyParams = this.getCacheKeyParams(request);
    const hash = createHash("sha256").update(JSON.stringify(keyParams)).digest("hex");
    return `${this.provider}_${hash}`;
  }
}

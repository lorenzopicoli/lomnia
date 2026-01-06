import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import { timeAwareCacheIndexTable } from "../../models/TimeAwareCacheIndex";
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
  };
}

/**
 * Store JSON blobs in a way that the cache is replayable for any period in time
 */
export abstract class TimeAwareCache<Response, Request, CacheKeyParams = Request> {
  // TODO: might be a good idea to also have a local cache layer for fast replays?
  // private localCache: Map<string, NominatimCacheEntry> = new Map();
  private s3: S3;
  private logger = new Logger("TimeAwareCache");
  private bucket: string;
  private provider: string;
  /**
   * For how long before/after the event date is the cache valid for
   */
  private timeWindowInDays: number;

  constructor(params: {
    bucket: string;
    provider: string;
    timeWindowInDays: number;
  }) {
    this.s3 = S3.init();
    this.bucket = params.bucket;
    this.timeWindowInDays = params.timeWindowInDays;
    this.provider = params.provider;
  }

  /**
   * Get cached response for a request
   * @returns Cached response if found and not expired, null otherwise
   */
  async get(request: Request, eventAt: DateTime): Promise<CacheEntry<Response, Request> | null> {
    try {
      const cacheKey = this.getCacheKey(request);
      const entry = await db
        .select()
        .from(timeAwareCacheIndexTable)
        .where(
          and(
            eq(timeAwareCacheIndexTable.provider, this.provider),
            eq(timeAwareCacheIndexTable.cacheKey, cacheKey),
            lte(timeAwareCacheIndexTable.validFrom, eventAt.toJSDate()),
            gte(timeAwareCacheIndexTable.validTo, eventAt.toJSDate()),
          ),
        )
        // Get the one that is the closest to the event date
        .orderBy(sql`ABS(EXTRACT(EPOCH FROM (${timeAwareCacheIndexTable.eventAt} - ${eventAt.toISO()})))`)
        .limit(1)
        .then((r) => r[0] ?? null);
      if (!entry) {
        return null;
      }
      const filePath = await this.s3.downloadTmp(this.bucket, entry.s3Key);

      const gzipped = fs.readFileSync(filePath);
      const json = gunzipSync(gzipped).toString("utf8");
      const currentData: CacheEntry<Response, Request> = JSON.parse(json);

      return currentData;
    } catch (error) {
      this.logger.debug("Cache miss (S3 error)", { error });
      return null;
    }
  }

  /**
   * Store response in cache
   * @param response Nominatim API response
   * @param params Nominatim API request
   */
  async set(params: { request: Request; response: Response; eventAt: DateTime; fetchedAt: DateTime }): Promise<void> {
    const { request, response, eventAt, fetchedAt } = params;
    const cacheKey = this.getCacheKey(request);
    const s3Key = this.getS3Key();
    const eventAtIso = eventAt.toISO();

    if (!eventAtIso) {
      this.logger.error("Failed to fetch eventAtIso", { cacheKey, request });
      return;
    }

    const cacheEntry: CacheEntry<Response, Request> = {
      response,
      request,
      metadata: {
        cachedAt: DateTime.utc().toISO(),
        eventAt: eventAtIso,
      },
    };
    const gzipped = gzipSync(JSON.stringify(cacheEntry));
    await this.s3.uploadGzip(this.bucket, s3Key, gzipped);
    await db.insert(timeAwareCacheIndexTable).values({
      cacheKey,
      provider: this.provider,
      s3Key,
      validFrom: eventAt.minus({ days: this.timeWindowInDays }).toJSDate(),
      validTo: eventAt.plus({ days: this.timeWindowInDays }).toJSDate(),
      fetchedAt: fetchedAt.toJSDate(),
      eventAt: eventAt.toJSDate(),

      createdAt: new Date(),
    });
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

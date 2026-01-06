import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const timeAwareCacheIndexTable = pgTable("time_aware_cache_index", {
  id: serial("id").primaryKey(),

  /**
   * Logical cache identity (hash of params)
   */
  cacheKey: text("cache_key").notNull(),

  /**
   * Provider of the data
   */
  provider: text("provider").notNull(),

  /**
   * Exact S3 object key containing the cached response
   */
  s3Key: text("s3_key").notNull(),

  /**
   * Temporal validity window (event time)
   */
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),

  /**
   * When the data was fetched
   */
  fetchedAt: timestamp("fetched_at").notNull(),

  /**
   * When the event happened
   */
  eventAt: timestamp("event_at").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type TimeAwareCacheIndex = typeof timeAwareCacheIndexTable.$inferSelect;
export type NewTimeAwareCacheIndex = typeof timeAwareCacheIndexTable.$inferInsert;

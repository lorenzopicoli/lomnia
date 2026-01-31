import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";
import { websitesTable } from "./Website";

export const websitesVisitsTable = pgTable("websites_visits", {
  id: serial("id").primaryKey(),

  /**
   * External identifier provided by the source system
   */
  externalId: text("external_id").notNull(),

  /**
   * The application or service that recorded this visit
   */
  source: text("source"),

  /**
   * If this visit resulted in a file download, the downloaded file name or URL
   */
  fileDownloaded: text("file_downloaded"),

  /**
   * The visit type as reported by the source
   * (eg. link, typed, bookmark, reload, download)
   */
  type: text("type"),

  /**
   * The website that was visited
   */
  websiteExternalId: text("website_external_id")
    .references(() => websitesTable.externalId)
    .notNull(),

  /**
   * The previous visit that led to this one
   */
  fromVisitExternalId: text("from_visit_external_id"),

  /**
   * The date at which the visit occurred, in UTC time
   */
  recordedAt: timestamp("recorded_at").notNull(),

  /**
   * Import job responsible for creating this record
   */
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type WebsiteVisit = typeof websitesVisitsTable.$inferSelect;
export type NewWebsiteVisit = typeof websitesVisitsTable.$inferInsert;

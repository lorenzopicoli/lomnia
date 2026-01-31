import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { importJobsTable } from "./ImportJob";

export const websitesTable = pgTable("websites", {
  id: serial("id").primaryKey(),

  /**
   * External identifier provided by the source system
   */
  externalId: text("external_id").notNull(),

  /**
   * The application or service that provided this website
   */
  source: text("source"),

  /**
   * Canonical URL for the website
   */
  url: text("url").notNull(),

  /**
   * Human-readable title extracted or provided by the source
   */
  title: text("title"),

  /**
   * Short description or summary of the website
   */
  description: text("description"),

  /**
   * URL to a preview or OpenGraph image
   */
  previewImageUrl: text("preview_image_url"),

  /**
   * Import job responsible for creating this record
   */
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),

  /**
   * The date at which the website was recorded, in UTC time
   */
  recordedAt: timestamp("recorded_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type Website = typeof websitesTable.$inferSelect;
export type NewWebsite = typeof websitesTable.$inferInsert;

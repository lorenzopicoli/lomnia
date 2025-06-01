import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const importJobsTable = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  /**
   * In UTC
   */
  jobStart: timestamp("job_start").notNull(),
  /**
   * In UTC
   */
  jobEnd: timestamp("job_end").notNull(),
  /**
   * In UTC
   * The oldest object that was generated from an import. This is useful
   * to see the impact of a job if some manual investigation is needed
   */
  firstEntryDate: timestamp("first_entry_date").notNull(),
  /**
   * In UTC
   * The newest object that was generated from an import. This is useful
   * to see the impact of a job if some manual investigation is needed
   */
  lastEntryDate: timestamp("last_entry_date").notNull(),
  /**
   * The column/key from the external source that tracks the date of
   * something. For example, in pihole queries, the timestamp key
   * stores the date information.
   * This is useful to trace back data to the source
   */
  entryDateKey: text("entry_date_key").notNull(),
  /**
   * The table or tables that are affected in the Lomnia DB by this import
   * Used as a note and not for automated tasks
   */
  destinationTable: text("destination_table").notNull(),
  /**
   * The name/id of the source that is recorded by this job. This is useful
   * not only to identify what is being imported, but to know if it was an older version of the code.
   * Ideally every major change in the importers should report a different source.
   * Eg. pihole-v1, pihole-v2
   */
  source: text("source").notNull(),
  /**
   * How many entries were created (not affected, but created) in the Lomnia DB by this import
   */
  importedCount: integer("imported_count").notNull(),
  /**
   * The number of API calls done by a job, if it performs API calls
   */
  apiCallsCount: integer("api_calls_count"),
  /**
   * The version of the api used to make the requests
   */
  apiVersion: text("api_version"),
  /**
   * Useful logs for debugging. Be careful to not fill this up too much and take too much disk space
   */
  logs: jsonb("logs").notNull(),
  /**
   * In UTC
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  /**
   * In UTC
   */
  updatedAt: timestamp("updated_at"),
});

export type ImportJob = typeof importJobsTable.$inferSelect;

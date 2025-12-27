import { integer, jsonb, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

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
   * How many entries were created (not affected, but created) in the Lomnia DB by this import
   */
  importedCount: integer("imported_count").notNull(),
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

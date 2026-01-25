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
   * Payload that was processed from the RabbitMQ queue
   */
  queuePayload: jsonb("queue_payload").notNull(),
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

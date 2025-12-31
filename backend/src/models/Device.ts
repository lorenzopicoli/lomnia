import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Canonical devices (user-facing)
 */
export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),

  /**
   * User-defined device name
   */
  name: text("name").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type Device = typeof devicesTable.$inferSelect;
export type NewDevice = typeof devicesTable.$inferInsert;

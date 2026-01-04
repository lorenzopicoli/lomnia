import { geometry, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { locationDetailsTable } from "./LocationDetails";

export const pointsOfInterestTable = pgTable("points_of_interest", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  polygon: geometry("polygon").notNull(),
  geoJson: jsonb("geo_json").notNull(),
  locationDetailsId: integer("location_details_id")
    .references(() => locationDetailsTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type PointOfInterest = typeof pointsOfInterestTable.$inferSelect;
export type NewPointOfInterest = typeof pointsOfInterestTable.$inferInsert;

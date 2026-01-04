import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { polygon } from "../db/types";
import { locationDetailsTable } from "./LocationDetails";

export const placesOfInterestTable = pgTable("places_of_interest", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /**
   * The postgis geometry generated from the user inputed geoJSON
   */
  polygon: polygon("polygon").notNull(),
  /**
   * The input geoJSON as it was sent by the client
   */
  geoJson: jsonb("geo_json").notNull(),
  locationDetailsId: integer("location_details_id")
    .references(() => locationDetailsTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type PlaceOfInterest = typeof placesOfInterestTable.$inferSelect;
export type NewPlaceOfInterest = typeof placesOfInterestTable.$inferInsert;

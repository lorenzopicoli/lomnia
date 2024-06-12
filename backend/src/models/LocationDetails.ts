import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'
import { geography } from '../db/types'
import { importJobsTable } from './ImportJob'
import type { getTableColumns } from 'drizzle-orm'

export const locationDetailsSource = pgEnum('locations_details_source', [
  'external',
  'userPOIJson',
])

// Define the location_details table schema
export const locationDetailsTable = pgTable('location_details', {
  id: serial('id').primaryKey(),

  /**
   * The location used to fetch this weather record OR the nearest grid location.
   * This will be a point in a grid created by SnapToGrid with 0.01 precision
   *
   * More info: https://postgis.net/docs/ST_SnapToGrid.html
   */
  location: geography('location').notNull(),

  source: locationDetailsSource('source').notNull(),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),

  placeId: text('place_id'),
  licence: text('licence'),
  osmType: text('osm_type'),
  osmId: text('osm_id'),
  placeRank: integer('place_rank'),
  category: text('category'),
  type: text('type'),
  importance: decimal('importance'),
  addressType: text('address_type'),
  displayName: text('display_name'),
  extraTags: jsonb('extra_tags'),
  nameDetails: jsonb('name_details'),
  name: text('name'),

  houseNumber: text('house_number'),
  road: text('road'),
  neighbourhood: text('neighbourhood'),
  suburb: text('suburb'),
  city: text('city'),
  county: text('county'),
  region: text('region'),
  state: text('state'),
  iso3166_2_lvl4: text('iso3166_2_lvl4'),
  postcode: text('postcode'),
  country: text('country'),
  countryCode: text('country_code'),
})

export type LocationDetails = typeof locationDetailsTable.$inferSelect
export type NewLocationDetails = typeof locationDetailsTable.$inferInsert

export type LocationDetailsColumns = keyof ReturnType<
  typeof getTableColumns<typeof locationDetailsTable>
>

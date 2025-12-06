import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_locations_location_geog
    ON locations
    USING GIST (location);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_locations_location_geog;
  `);
}

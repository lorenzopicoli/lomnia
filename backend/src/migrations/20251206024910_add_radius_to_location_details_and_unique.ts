import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("location_details", (table) => table.integer("radius").nullable());
  await knex.raw(`
    CREATE UNIQUE INDEX location_details_location_source_radius_unique_idx 
    ON location_details (source, location, radius)
    WHERE radius IS NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS location_details_location_source_radius_unique_idx;
  `);
  await knex.schema.alterTable("location_details", (table) => table.dropColumn("radius"));
}

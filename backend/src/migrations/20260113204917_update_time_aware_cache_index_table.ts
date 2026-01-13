import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("time_aware_cache_index", (table) => {
    table.geography("location").notNullable();
  });
  await knex.raw(`
    CREATE INDEX locations_location_index
    ON time_aware_cache_index (location);
  `);
  await knex.schema.renameTable("time_aware_cache_index", "location_date_cache_index");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable("location_date_cache_index", "time_aware_cache_index");
  await knex.schema.alterTable("time_aware_cache_index", (table) => {
    table.dropColumn("location");
  });
}

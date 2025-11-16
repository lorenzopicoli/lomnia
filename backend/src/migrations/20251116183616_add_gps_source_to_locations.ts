import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    table.string("gps_source").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    table.dropColumn("gps_source");
  });
}

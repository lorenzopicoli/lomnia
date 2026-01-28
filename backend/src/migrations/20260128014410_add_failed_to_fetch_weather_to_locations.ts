import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    table.boolean("failed_to_fetch_weather").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    table.dropColumn("failed_to_fetch_weather");
  });
}

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("locations", (table) => {
    table.index(["location_fix", "location_details_id"]);
  });
}

export async function down(knex: Knex) {
  await knex.schema.alterTable("locations", (table) => {
    table.dropIndex(["location_fix", "location_details_id"]);
  });
}

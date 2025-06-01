import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("locations", (table) => {
    table.dropForeign(["location_details_id"]);
    table.integer("location_details_id").references("location_details.id").onDelete("SET NULL").alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("locations", (table) => {
    table.dropForeign(["location_details_id"]);
    table
      .integer("location_details_id")
      .references("location_details.id")
      //   .index()
      .alter();
  });
}

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("location_details", async (table) => {
    table.dropColumn("radius");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("location_details", (table) => table.integer("radius").nullable());
}

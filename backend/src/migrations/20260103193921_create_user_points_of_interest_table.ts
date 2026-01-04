import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("points_of_interest", async (table) => {
    table.timestamps();
    table.string("name").notNullable();
    table.geometry("polygon").notNullable();
    table.jsonb("geo_json").notNullable();
    table.integer("location_details_id").references("location_details.id").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("points_of_interest");
}

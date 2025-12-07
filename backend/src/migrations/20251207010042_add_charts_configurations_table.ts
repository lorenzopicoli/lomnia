import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("dashboards", (table) => {
    table.increments();
    table.timestamps();
    table.text("name").notNullable();

    table.jsonb("content").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("dashboards");
}

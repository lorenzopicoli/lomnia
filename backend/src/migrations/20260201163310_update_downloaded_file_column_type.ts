import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("websites_visits", (table) => table.text("file_downloaded").alter());
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("websites_visits", (table) => table.string("file_downloaded").alter());
}

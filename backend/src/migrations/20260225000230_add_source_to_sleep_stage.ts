import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleep_stages", (table) => table.text("source").notNullable());
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleep_stages", (table) => table.dropColumn("source"));
}

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.dropColumn("sleep_id");
  });
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.text("sleep_id").references("sleeps.external_id").index().notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.dropColumn("sleep_id");
  });
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.integer("sleep_id").references("sleeps.id").index().notNullable();
  });
}

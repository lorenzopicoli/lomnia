import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("websites_visits", (table) => {
    table.string("timezone");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("websites_visits", (table) => {
    table.dropColumn("timezone");
  });
}

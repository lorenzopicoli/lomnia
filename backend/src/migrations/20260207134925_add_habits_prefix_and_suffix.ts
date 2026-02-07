import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.string("value_prefix").nullable();
    table.string("value_suffix").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("value_prefix");
    table.dropColumn("value_suffix");
  });
}

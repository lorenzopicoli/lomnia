import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("device_statuses", (table) => {
    table.float("temperature").nullable();
    table.string("timezone").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("device_statuses", (table) => {
    table.dropColumn("temperature");
    table.string("timezone").notNullable().alter();
  });
}

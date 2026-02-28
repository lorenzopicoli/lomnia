import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("external_devices", (table) => {
    table.text("name").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("external_devices", (table) => {
    table.dropColumn("name");
  });
}

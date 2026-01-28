import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", async (table) => {
    table.text("external_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", async (table) => {
    table.dropColumn("external_id");
  });
}

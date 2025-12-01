import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("recorded_at");
  });
  await knex.schema.alterTable("habits", (table) => {
    table.timestamp("recorded_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("recorded_at");
  });
  return knex.schema.alterTable("habits", (table) => {
    table.string("recorded_at");
  });
}

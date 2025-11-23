import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("date");
  });
  await knex.schema.alterTable("habits", (table) => {
    table.timestamp("date").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("date");
  });
  await knex.schema.alterTable("habits", (table) => {
    table.date("date").notNullable();
  });
}

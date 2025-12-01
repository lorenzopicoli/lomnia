import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("source");
  });
  await knex.schema.alterTable("habits", (table) => {
    table.string("source").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("source");
  });
  await knex.schema.alterTable("habits", (table) => {
    table.enum("source", ["files", "hares"]).notNullable();
  });
}

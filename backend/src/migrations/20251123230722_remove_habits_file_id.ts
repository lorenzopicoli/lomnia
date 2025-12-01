import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.dropColumn("file_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("habits", (table) => {
    table.integer("file_id").references("files.id").nullable();
  });
}

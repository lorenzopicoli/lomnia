import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercises", (table) => {
    table.float("avg_cadence").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercises", (table) => {
    table.dropColumn("avg_cadence");
  });
}

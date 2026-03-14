import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercise_metrics", (table) => {
    table.float("distance");
    table.dropColumn("source");
  });
  await knex.schema.alterTable("exercise_laps", (table) => {
    table.dropColumn("distance");
  });
  await knex.schema.alterTable("exercise_laps", (table) => {
    table.float("distance");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercise_metrics", (table) => {
    table.dropColumn("distance");
    table.text("source");
  });
  await knex.schema.alterTable("exercise_laps", (table) => {
    table.dropColumn("distance");
  });
  await knex.schema.alterTable("exercise_laps", (table) => {
    table.integer("distance");
  });
}

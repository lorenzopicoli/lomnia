import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercise_metrics", (table) => {
    table.dropColumn("exercise_id");
  });
  await knex.schema.alterTable("exercise_metrics", (table) => {
    table.integer("exercise_id").references("id").inTable("exercises").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {}

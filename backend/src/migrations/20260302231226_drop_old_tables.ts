import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("exercise_measurements");
  await knex.schema.dropTableIfExists("exercises");
}

export async function down(knex: Knex): Promise<void> {}

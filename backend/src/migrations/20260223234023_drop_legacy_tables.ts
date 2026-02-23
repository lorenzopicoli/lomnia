import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.dropTable("dns_queries");
  knex.schema.dropTable("exercise_measurements");
  knex.schema.dropTable("exercises");
  knex.schema.dropTable("snoring_records");
  knex.schema.dropTable("step_counts");
}

export async function down(knex: Knex): Promise<void> {}

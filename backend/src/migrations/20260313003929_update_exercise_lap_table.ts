import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercise_laps", (table) => {
    table.float("max_pace").nullable();
    table.float("avg_step_length").nullable();
    table.float("avg_stance_time").nullable();
    table.float("avg_vertical_oscillation").nullable();
    table.float("max_cadence").nullable();
    table.float("avg_cadence").nullable();
    table.float("max_heart_rate").nullable();
    table.dropColumn("exercise_id");
  });
  await knex.schema.alterTable("exercise_laps", (table) => {
    table.integer("exercise_id").references("id").inTable("exercises").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {}

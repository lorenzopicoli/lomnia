import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercises", (table) => {
    table.dropColumn("self_evaluation");
    table.integer("perceived_effort");
    table.integer("feel_score");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercises", (table) => {
    table.integer("self_evaluation");
    table.dropColumn("perceived_effort");
    table.dropColumn("feel_score");
  });
}

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("habit_features", (table) => {
    table.increments();
    table.timestamps();
    table.text("name").nullable();

    table.jsonb("rules").notNullable();
  });
  await knex.schema.createTable("extracted_habit_features", (table) => {
    table.increments();
    table.timestamps();
    table.integer("habit_feature_id").notNullable().references("habit_features.id").index();
    table.integer("habit_id").notNullable().references("habits.id").index();

    table.jsonb("value").notNullable();
    table.jsonb("original_value").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("extracted_habit_features");
  await knex.schema.dropTable("habit_features");
}

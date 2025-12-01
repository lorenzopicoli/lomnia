import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("habits", (table) => {
    table.enum("source", ["files", "hares"]).notNullable();
    table.string("timezone").notNullable();
    table.string("comments").nullable();
    table.string("recorded_at").nullable();
    table.enum("period_of_day", ["morning", "afternoon", "evening", "over_night"]).nullable();
    table.boolean("is_full_day").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("habits", (table) => {
    table.dropColumn("source");
    table.dropColumn("timezone");
    table.dropColumn("comments");
    table.dropColumn("recorded_at");
    table.dropColumn("time_of_day");
    table.dropColumn("is_full_day");
  });
}

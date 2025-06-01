import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("daily_weather", (table) => {
    table.geography("location").notNullable();
  });
  await knex.schema.alterTable("hourly_weather", (table) => {
    table.geography("location").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("daily_weather", (table) => {
    table.dropColumn("location");
  });
  await knex.schema.alterTable("hourly_weather", (table) => {
    table.dropColumn("location");
  });
}

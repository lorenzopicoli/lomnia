import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("time_aware_cache_index", (table) => {
    table.increments();

    table.text("cache_key").notNullable().index();
    table.text("s3_key").notNullable();
    table.text("provider").notNullable().index();
    table.timestamp("valid_from").notNullable().index();
    table.timestamp("valid_to").notNullable().index();
    table.timestamp("fetched_at").notNullable();
    table.timestamp("event_at").notNullable().index();

    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("time_aware_cache_index");
}

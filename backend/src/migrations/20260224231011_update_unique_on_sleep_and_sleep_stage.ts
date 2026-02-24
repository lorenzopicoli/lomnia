import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleeps", (table) => {
    table.unique(["external_id"]);
    table.text("timezone").nullable().alter();
    table.dropChecks("sleeps_source_check");
  });
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.unique(["external_id"]);
    table.text("timezone").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleeps", (table) => {
    table.dropUnique(["external_id"]);
    table.text("timezone").notNullable().alter();
  });
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.dropUnique(["external_id"]);
    table.text("timezone").notNullable().alter();
  });
}

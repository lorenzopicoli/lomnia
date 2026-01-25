import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("import_jobs", async (table) => {
    table.dropColumn("logs");
    table.jsonb("queue_payload");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("import_jobs", async (table) => {
    table.jsonb("logs");
    table.dropColumn("queue_payload");
  });
}

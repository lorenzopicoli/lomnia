import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("hourly_weather", async (table) => {
    table.dropColumn("import_job_id");
  });
  await knex.schema.alterTable("daily_weather", async (table) => {
    table.dropColumn("import_job_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("hourly_weather", async (table) => {
    table.integer("import_job_id").references("import_jobs.id").notNullable();
  });
  await knex.schema.alterTable("daily_weather", async (table) => {
    table.integer("import_job_id").references("import_jobs.id").notNullable();
  });
}

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("location_details", async (table) => {
    table.dropColumn("import_job_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("location_details", async (table) => {
    table.integer("import_job_id").references("import_jobs.id").notNullable();
  });
}

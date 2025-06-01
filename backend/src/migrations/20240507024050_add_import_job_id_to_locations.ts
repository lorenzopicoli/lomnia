import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    table.integer("import_job_id").references("import_jobs.id").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    table.dropColumn("import_job_id");
  });
}

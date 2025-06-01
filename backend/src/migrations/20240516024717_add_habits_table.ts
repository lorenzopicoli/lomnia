import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("habits", (table) => {
    table.increments();
    table.integer("import_job_id").references("import_jobs.id").notNullable();
    table.integer("file_id").references("files.id").nullable();
    table.timestamp("date").notNullable();
    table.string("key").notNullable();
    table.jsonb("value").notNullable();

    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("habits");
}

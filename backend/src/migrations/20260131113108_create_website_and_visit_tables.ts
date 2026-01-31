import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("websites", (table) => {
    table.increments();
    table.string("external_id").notNullable().unique().index();
    table.string("source");
    table.text("url").notNullable().index();
    table.text("host").index();
    // Use text to allow for longer texts
    table.text("title");
    table.text("description");
    table.text("preview_image_url");
    table.integer("import_job_id").references("import_jobs.id").notNullable();

    table.timestamp("recorded_at");

    table.timestamps();
  });
  await knex.schema.createTable("websites_visits", (table) => {
    table.increments();
    table.string("external_id").notNullable().unique().index();
    table.string("source");
    table.string("file_downloaded");
    table.string("type");
    table.string("website_external_id").references("websites.external_id").notNullable().index().deferrable("deferred");
    table.string("from_visit_external_id");

    table.timestamp("recorded_at").notNullable().index();

    table.integer("import_job_id").references("import_jobs.id").notNullable();
    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("websites_visits");
  await knex.schema.dropTable("websites");
}

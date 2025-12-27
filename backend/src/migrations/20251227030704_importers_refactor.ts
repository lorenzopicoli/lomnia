import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("import_jobs", (table) => {
    table.dropColumn("first_entry_date");
    table.dropColumn("last_entry_date");
    table.dropColumn("entry_date_key");
    table.dropColumn("destination_table");
    table.dropColumn("source");
    table.dropColumn("api_calls_count");
    table.dropColumn("api_version");
  });
  await knex.schema.alterTable("locations", async (table) => {
    table.text("external_id").alter();
    table.text("source").alter();
    table.dropChecks("locations_source_check");
    table.dropColumn("raw_data");

    table.renameColumn("location_fix", "recorded_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("import_jobs", (table) => {
    table.timestamp("first_entry_date").notNullable();
    table.timestamp("last_entry_date").notNullable();

    table.text("entry_date_key").comment("The column/key used to populate the entry dates").notNullable();
    table.text("destination_table").notNullable();
    table.text("source").notNullable();
    table.integer("api_calls_count").nullable();
    table.string("api_version").nullable();
  });
  await knex.schema.alterTable("locations", (table) => {
    table.text("external_id").alter();
    table.jsonb("raw_data");
    table.text("source").alter();
    table
      .enum("source", ["sqlite_locations", "google", "google_new", "owntracks_api"])
      .notNullable()
      .defaultTo("sqlite_locations")
      .index();

    table.renameColumn("recorded_at", "location_fix");
  });
}

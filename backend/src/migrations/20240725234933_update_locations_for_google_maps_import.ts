import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    knex.raw("ALTER TABLE locations ALTER COLUMN battery_status DROP NOT NULL");
    table.integer("external_id").nullable().alter();
    table
      .enum("source", ["sqlite_locations", "google", "google_new"])
      .notNullable()
      .defaultTo("sqlite_locations")
      .index();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("locations", (table) => {
    knex.raw("ALTER TABLE locations ALTER COLUMN battery_status SET NOT NULL");
    table.integer("external_id").notNullable();
    table.dropColumn("source");
  });
}

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("devices", (table) => {
    table.increments();

    table.string("name").notNullable();

    table.timestamps(true, false);
  });
  await knex.schema.createTable("external_devices", (table) => {
    table.increments();

    table.string("external_id").notNullable().unique().index();
    table.string("source").notNullable();
    table.integer("device_id").nullable().references("id").inTable("devices").index();

    table.integer("import_job_id").notNullable().references("id").inTable("import_jobs").onDelete("cascade");
    table.timestamps(true, false);
  });
  await knex.schema.createTable("device_statuses", (table) => {
    table.increments();

    table.integer("device_id").notNullable().references("id").inTable("devices").index();
    table.string("external_device_id").notNullable().references("external_id").inTable("external_devices").index();
    table.string("external_id").nullable();

    table.string("source").notNullable();

    table.integer("battery").nullable().comment("Battery level in percent");
    table.enum("battery_status", ["unknown", "unplugged", "charging", "full"]).nullable();
    table.enum("connection_status", ["wifi", "offline", "data"]).nullable();

    table.string("timezone").notNullable();
    table.string("wifi_ssid").nullable();

    table.timestamp("recorded_at").notNullable().comment("UTC time when the device status was recorded").index();

    table.integer("import_job_id").notNullable().references("id").inTable("import_jobs").onDelete("cascade");
    table.timestamps(true, false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("device_statuses");
  await knex.schema.dropTable("devices");
}

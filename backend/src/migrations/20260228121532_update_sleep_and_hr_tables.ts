import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleeps", (table) => {
    // No FK constraint to allow imports without external devices
    table.string("external_device_id").index();
  });
  await knex.schema.alterTable("sleep_stages", (table) => {
    // No FK constraint to allow imports without external devices
    table.string("external_device_id").index();
  });
  await knex.schema.dropTableIfExists("heart_rate_readings");
  await knex.schema.createTable("heart_rate_readings", (table) => {
    table.increments();

    table.string("external_device_id").notNullable().index();
    table.string("external_id").nullable().unique().index();

    table.string("source").notNullable();

    table.float("heart_rate").notNullable();
    table.float("heart_rate_max").nullable();
    table.float("heart_rate_min").nullable();
    table.string("timezone").nullable();

    table.timestamp("recorded_at").notNullable().index();
    table.timestamp("started_at").nullable().index();
    table.timestamp("ended_at").nullable().index();

    table.integer("import_job_id").notNullable().references("id").inTable("import_jobs").onDelete("cascade");
    table.timestamps(true, false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("heart_rate_readings");
}

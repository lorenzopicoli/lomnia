import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sleep_stages", (table) => {
    table.renameColumn("start_time", "started_at");
    table.renameColumn("end_time", "ended_at");
  });

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.renameColumn("sleep_record_id", "sleep_id");
  });

  await knex.raw(`
    ALTER TABLE sleep_stages
    ALTER COLUMN samsung_sleep_id TYPE text USING samsung_sleep_id::text
  `);

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.renameColumn("samsung_sleep_id", "external_id");
  });

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.dropColumn("data_export_id");
  });

  await knex.raw(`
    ALTER INDEX sleep_stages_start_time_index RENAME TO sleep_stages_started_at_index;
    ALTER INDEX sleep_stages_end_time_index RENAME TO sleep_stages_ended_at_index;
    ALTER INDEX sleep_stages_sleep_record_id_index RENAME TO sleep_stages_sleep_id_index;
    ALTER INDEX sleep_stages_samsung_sleep_id_index RENAME TO sleep_stages_external_id_index;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE sleep_stages
    ALTER COLUMN stage TYPE text USING stage::text
  `);

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.string("data_export_id", 255).notNullable();
  });

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.renameColumn("external_id", "samsung_sleep_id");
  });

  await knex.raw(`
    ALTER TABLE sleep_stages
    ALTER COLUMN samsung_sleep_id TYPE uuid USING samsung_sleep_id::uuid
  `);

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.renameColumn("sleep_id", "sleep_record_id");
  });

  await knex.schema.alterTable("sleep_stages", (table) => {
    table.renameColumn("started_at", "start_time");
    table.renameColumn("ended_at", "end_time");
  });

  await knex.raw(`
    ALTER INDEX sleep_stages_started_at_index RENAME TO sleep_stages_start_time_index;
    ALTER INDEX sleep_stages_ended_at_index RENAME TO sleep_stages_end_time_index;
    ALTER INDEX sleep_stages_sleep_id_index RENAME TO sleep_stages_sleep_record_id_index;
    ALTER INDEX sleep_stages_external_id_index RENAME TO sleep_stages_samsung_sleep_id_index;
  `);
}

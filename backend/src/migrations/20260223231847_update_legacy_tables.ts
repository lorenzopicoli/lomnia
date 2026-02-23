import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable("sleep_records", "sleeps");

  await knex.schema.alterTable("sleeps", (table) => {
    table.renameColumn("bed_time", "started_at");
    table.renameColumn("awake_time", "ended_at");
    table.renameColumn("is_sleep_time_manual", "is_manually_recorded");
    table.renameColumn("sleep_score_manual", "user_score");
    table.renameColumn("sleep_score_external", "automatic_score");
  });

  await knex.raw(`
    ALTER TABLE sleeps
    ALTER COLUMN samsung_sleep_id TYPE text USING samsung_sleep_id::text
  `);

  await knex.schema.alterTable("sleeps", (table) => {
    table.renameColumn("samsung_sleep_id", "external_id");
  });

  await knex.schema.alterTable("sleeps", (table) => {
    table.dropColumn("mental_recovery");
    table.dropColumn("physical_recovery");
    table.dropColumn("sleep_cycles");
    table.dropColumn("efficiency");
    table.dropColumn("data_export_id");
  });

  await knex.raw(`
    ALTER TABLE sleeps DROP CONSTRAINT IF EXISTS sleep_records_source_check
  `);

  await knex.raw(`
    ALTER TABLE sleeps
    ADD CONSTRAINT sleeps_source_check
    CHECK (source = ANY (ARRAY['obsidian', 'samsung_health']))
  `);

  await knex.raw(`
    ALTER INDEX sleep_records_pkey RENAME TO sleeps_pkey;
    ALTER INDEX sleep_records_awake_time_index RENAME TO sleeps_ended_at_index;
    ALTER INDEX sleep_records_bed_time_index RENAME TO sleeps_started_at_index;
    ALTER INDEX sleep_records_import_job_id_index RENAME TO sleeps_import_job_id_index;
    ALTER INDEX sleep_records_samsung_sleep_id_index RENAME TO sleeps_external_id_index;
    ALTER INDEX sleep_records_source_index RENAME TO sleeps_source_index;
  `);

  await knex.raw(`
    ALTER TABLE sleeps
    RENAME CONSTRAINT sleep_records_import_job_id_foreign
    TO sleeps_import_job_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE sleep_stages
    RENAME CONSTRAINT sleep_stages_sleep_record_id_foreign
    TO sleep_stages_sleep_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE snoring_records
    RENAME CONSTRAINT snoring_records_sleep_record_id_foreign
    TO snoring_records_sleep_id_foreign
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable("sleeps", "sleep_records");

  await knex.schema.alterTable("sleep_records", (table) => {
    table.renameColumn("started_at", "bed_time");
    table.renameColumn("ended_at", "awake_time");
    table.renameColumn("is_manually_recorded", "is_sleep_time_manual");
    table.renameColumn("user_score", "sleep_score_manual");
    table.renameColumn("automatic_score", "sleep_score_external");
    table.renameColumn("external_id", "samsung_sleep_id");
  });

  await knex.raw(`
    ALTER TABLE sleep_records
    ALTER COLUMN samsung_sleep_id TYPE uuid USING samsung_sleep_id::uuid
  `);

  await knex.schema.alterTable("sleep_records", (table) => {
    table.integer("mental_recovery");
    table.integer("physical_recovery");
    table.integer("sleep_cycles");
    table.integer("efficiency");
    table.string("data_export_id", 255);
  });

  await knex.raw(`
    ALTER TABLE sleep_records DROP CONSTRAINT IF EXISTS sleeps_source_check
  `);

  await knex.raw(`
    ALTER TABLE sleep_records
    ADD CONSTRAINT sleep_records_source_check
    CHECK (source = ANY (ARRAY['obsidian', 'samsung_health']))
  `);

  await knex.raw(`
    ALTER INDEX sleeps_pkey RENAME TO sleep_records_pkey;
    ALTER INDEX sleeps_ended_at_index RENAME TO sleep_records_awake_time_index;
    ALTER INDEX sleeps_started_at_index RENAME TO sleep_records_bed_time_index;
    ALTER INDEX sleeps_import_job_id_index RENAME TO sleep_records_import_job_id_index;
    ALTER INDEX sleeps_external_id_index RENAME TO sleep_records_samsung_sleep_id_index;
    ALTER INDEX sleeps_source_index RENAME TO sleep_records_source_index;
  `);

  await knex.raw(`
    ALTER TABLE sleep_records
    RENAME CONSTRAINT sleeps_import_job_id_foreign
    TO sleep_records_import_job_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE sleep_stages
    RENAME CONSTRAINT sleep_stages_sleep_id_foreign
    TO sleep_stages_sleep_record_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE snoring_records
    RENAME CONSTRAINT snoring_records_sleep_id_foreign
    TO snoring_records_sleep_record_id_foreign
  `);
}

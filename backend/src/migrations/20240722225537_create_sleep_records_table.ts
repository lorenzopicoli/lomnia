import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sleep_records', (table) => {
    table.increments()
    table.timestamp('bed_time').notNullable().index()
    table.timestamp('awake_time').notNullable().index()

    table.boolean('is_sleep_time_manual').notNullable()

    table.integer('sleep_score_manual')
    table.integer('sleep_score_external')
    table.integer('mental_recovery')
    table.integer('physical_recovery')
    table.integer('sleep_cycles')
    table.integer('efficiency')
    table.text('comment')

    table.enum('source', ['obsidian', 'samsung_health']).notNullable().index()

    table.uuid('samsung_sleep_id').index()

    table.string('timezone').notNullable()
    table
      .integer('import_job_id')
      .references('import_jobs.id')
      .notNullable()
      .index()

    table.string('data_export_id')
    table.timestamps()
  })

  await knex.schema.createTable('sleep_stages', (table) => {
    table.increments()

    table.timestamp('start_time').notNullable().index()
    table.timestamp('end_time').notNullable().index()
    table.string('timezone').notNullable()

    table.enum('stage', ['awake', 'light', 'deep', 'rem']).notNullable().index()

    table
      .integer('sleep_record_id')
      .references('sleep_records.id')
      .notNullable()
      .index()

    table.uuid('samsung_sleep_id').index()

    table
      .integer('import_job_id')
      .references('import_jobs.id')
      .notNullable()
      .index()

    table.string('data_export_id').notNullable()
    table.timestamps()
  })

  await knex.schema.createTable('snoring_records', (table) => {
    table.increments()

    table.timestamp('start_time').notNullable().index()
    table.timestamp('end_time').notNullable().index()
    table.string('timezone').notNullable()

    table
      .integer('sleep_record_id')
      .references('sleep_records.id')
      .notNullable()
      .index()

    table
      .integer('import_job_id')
      .references('import_jobs.id')
      .notNullable()
      .index()

    table.string('data_export_id').notNullable()
    table.timestamps()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sleep_records')
  await knex.schema.dropTable('sleep_stages')
  await knex.schema.dropTable('snoring_records')
}

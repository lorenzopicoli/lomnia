import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('heart_rate_readings', (table) => {
    table.increments()
    table.timestamp('start_time').notNullable().index()
    table.timestamp('end_time').notNullable().index()
    table.integer('heart_rate').notNullable()
    table.integer('heart_rate_max').notNullable()
    table.integer('heart_rate_min').notNullable()
    table.string('timezone').notNullable()
    table.string('comment')
    table.uuid('bin_uuid').index()

    table.string('data_export_id').notNullable()

    table
      .integer('import_job_id')
      .references('import_jobs.id')
      .notNullable()
      .index()

    table.timestamps()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('heart_rate_readings')
}

import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('daily_weather', (table) => {
    table.index('import_job_id')
    table.index('date')
    table.index('location')
    table.unique(['location', 'date'])
  })
  await knex.schema.alterTable('dns_queries', (table) => {
    table.index('import_job_id')
    table.index('domain')
    table.index('query_timestamp')
  })
  await knex.schema.alterTable('files', (table) => {
    table.index('import_job_id')
    table.index('source')
    table.unique('checksum')
  })
  await knex.schema.alterTable('habits', (table) => {
    table.index('import_job_id')
    table.index('file_id')
    table.index('key')
    table.index('date')
  })
  await knex.schema.alterTable('hourly_weather', (table) => {
    table.index('import_job_id')
    table.index('date')
    table.index('location')
    table.unique(['location', 'date'])
  })
  await knex.schema.alterTable('locations', (table) => {
    table.index('import_job_id')
    table.index('location_fix')
    table.index('hourly_weather_id')
    table.index('daily_weather_id')
    table.index('location')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('daily_weather', (table) => {
    table.dropIndex('import_job_id')
    table.dropIndex('date')
    table.dropIndex('location')
    table.dropUnique(['location', 'date'])
  })
  await knex.schema.alterTable('dns_queries', (table) => {
    table.dropIndex('import_job_id')
    table.dropIndex('domain')
    table.dropIndex('query_timestamp')
  })
  await knex.schema.alterTable('files', (table) => {
    table.dropIndex('import_job_id')
    table.dropIndex('source')
    table.dropUnique(['checksum'])
  })
  await knex.schema.alterTable('habits', (table) => {
    table.dropIndex('import_job_id')
    table.dropIndex('file_id')
    table.dropIndex('key')
    table.dropIndex('date')
  })
  await knex.schema.alterTable('hourly_weather', (table) => {
    table.dropIndex('import_job_id')
    table.dropIndex('date')
    table.dropIndex('location')
    table.dropUnique(['location', 'date'])
  })
  await knex.schema.alterTable('locations', (table) => {
    table.dropIndex('import_job_id')
    table.dropIndex('location_fix')
    table.dropIndex('hourly_weather_id')
    table.dropIndex('daily_weather_id')
    table.dropIndex('location')
  })
}

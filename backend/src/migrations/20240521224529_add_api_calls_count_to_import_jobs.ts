import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('import_jobs', (table) => {
    table.integer('api_calls_count').nullable()
    table.string('api_version').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('import_jobs', (table) => {
    table.dropColumn('api_calls_count')
    table.dropColumn('api_version')
  })
}

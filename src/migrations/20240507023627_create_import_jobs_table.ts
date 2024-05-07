import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('import_jobs', (table) => {
    table.increments()

    table.timestamp('job_start').notNullable()
    table.timestamp('job_end').notNullable()

    table.timestamp('first_entry_date').notNullable()
    table.timestamp('last_entry_date').notNullable()

    table
      .text('entry_date_key')
      .comment('The column/key used to populate the entry dates')
      .notNullable()

    table.integer('imported_count').notNullable()

    table.text('destination_table').notNullable()
    table.text('source').notNullable()

    table.jsonb('logs')

    table.timestamps()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('import_jobs')
}

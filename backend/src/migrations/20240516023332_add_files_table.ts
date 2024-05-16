import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('files', (table) => {
    table.increments()

    table.specificType('tags', 'text[]')
    table.jsonb('metadata')
    table.string('checksum').notNullable()
    table.timestamp('file_created_at').notNullable()
    table.timestamp('file_updated_at')
    table
      .text('relative_path')
      .comment('Relative to the base folder from import')
      .notNullable()
    table.enum('source', ['obsidian']).notNullable()
    table.enum('content_type', ['markdown']).notNullable()

    table.text('content').notNullable()
    table.integer('import_job_id').references('import_jobs.id').notNullable()

    table.timestamps()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('files')
}

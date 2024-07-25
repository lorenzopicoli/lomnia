import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('locations', (table) => {
    table.boolean('failed_to_reverse_geocode').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('locations', (table) => {
    table.dropColumn('failed_to_reverse_geocode')
  })
}

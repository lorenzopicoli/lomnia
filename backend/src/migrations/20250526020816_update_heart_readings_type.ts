import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('heart_rate_readings', (table) => {
    table.float('heart_rate').alter()
    table.float('heart_rate_max').alter()
    table.float('heart_rate_min').alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('heart_rate_readings', (table) => {
    table.integer('heart_rate').alter()
    table.integer('heart_rate_max').alter()
    table.integer('heart_rate_min').alter()
  })
}

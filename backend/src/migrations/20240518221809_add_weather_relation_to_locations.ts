import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('locations', (table) => {
    table.integer('daily_weather_id').references('daily_weather.id')
    table.integer('hourly_weather_id').references('hourly_weather.id')
    table.integer('daily_weather_attempts')
    table.integer('hourly_weather_attempts')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('locations', (table) => {
    table.dropColumn('daily_weather_id')
    table.dropColumn('hourly_weather_id')
    table.dropColumn('daily_weather_attempts')
    table.dropColumn('hourly_weather_attempts')
  })
}

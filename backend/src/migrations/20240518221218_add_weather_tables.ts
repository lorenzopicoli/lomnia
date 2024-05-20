import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hourly_weather', (table) => {
    table.increments()
    table.integer('import_job_id').references('import_jobs.id').notNullable()
    table.timestamp('date').notNullable()

    table.float('temperature2m')
    table.float('relative_humidity2m')
    table.float('apparent_temperature')
    table.float('precipitation')
    table.float('rain')
    table.float('snowfall')
    table.float('snow_depth')
    table.float('cloud_cover')
    table.float('wind_speed10m')
    table.float('wind_speed100m')

    table.integer('weather_code')
    table.timestamps()
  })
  await knex.schema.createTable('daily_weather', (table) => {
    table.increments()
    table.integer('import_job_id').references('import_jobs.id').notNullable()
    table.date('date').notNullable()
    table.timestamp('sunrise')
    table.timestamp('sunset')

    table.integer('weather_code')
    table.float('temperature2m_max')
    table.float('temperature2m_min')
    table.float('temperature2m_mean')
    table.float('apparent_temperature_max')
    table.float('apparent_temperature_min')
    table.float('daylight_duration')
    table.float('sunshine_duration')
    table.float('rain_sum')
    table.float('snowfall_sum')

    table.timestamps()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('hourly_weather')
  await knex.schema.dropTable('daily_weather')
}

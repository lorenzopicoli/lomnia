import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('locations', (table) => {
    table.increments()
    table.integer('external_id').notNullable()
    table.integer('accuracy').nullable().comment('in meters')
    table.integer('vertical_accuracy').nullable().comment('in meters')
    table.integer('velocity').nullable().comment('in km/h')
    table.integer('altitude').nullable().comment('in meters')
    table.integer('battery').nullable().comment('in percent')
    table
      .enum('battery_status', ['unknown', 'unplugged', 'charging', 'full'])
      .notNullable()
    table.enum('connection_status', ['wifi', 'offline', 'data'])
    table.geography('location').notNullable()
    table.enum('trigger', ['ping', 'circular', 'report_location', 'manual'])
    table.string('topic')
    table.string('wifi_ssid')

    table.jsonb('raw_data')

    table.timestamp('message_created_at')
    table.timestamp('location_fix')
    table.timestamps()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('locations')
}

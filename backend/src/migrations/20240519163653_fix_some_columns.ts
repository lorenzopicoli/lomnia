import { find } from 'geo-tz'
import type { Knex } from 'knex'

const updateTimezones = async (knex: Knex) => {
  const batchSize = 5000 // Adjust batch size as needed
  let offset = 0

  while (true) {
    const rows = await knex('locations')
      .select(
        'id',
        knex.raw('ST_X(location::geometry) as longitude'),
        knex.raw('ST_Y(location::geometry) as latitude')
      )
      .limit(batchSize)
      .offset(offset)
      .orderBy('id', 'desc')

    if (rows.length === 0) break

    const d: Record<string, string[]> = {}
    for (const row of rows) {
      const { id, latitude, longitude } = row

      const timezone = find(latitude, longitude)

      d[timezone[0]] = d[timezone[0]] ? [...d[timezone[0]], id] : [id]
    }

    for (const key of Object.keys(d)) {
      await knex('locations').whereIn('id', d[key]).update({ timezone: key })
    }
    offset += batchSize
    console.log(`Offset: ${offset}`)
  }

  console.log('Timezones updated successfully.')
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('locations', (table) => {
    table.string('timezone').nullable()
  })

  await updateTimezones(knex)

  await knex.schema.alterTable('locations', (table) => {
    table.string('timezone').notNullable().alter()
  })

  await knex.schema.alterTable('hourly_weather', (table) => {
    table.string('timezone').notNullable()
  })

  // Migrate dates from habits from timestamp to date format
  await knex.schema
    .table('habits', (table) => {
      return table.date('new_date_column')
    })
    .then(() => {
      return knex('habits').update({
        new_date_column: knex.raw('date::date'),
      })
    })
    .then(() => {
      return knex.schema.table('habits', (table) => {
        table.dropColumn('date')
      })
    })
    .then(() => {
      return knex.schema.table('habits', (table) => {
        table.renameColumn('new_date_column', 'date')
      })
    })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('locations', (table) => {
    table.dropColumn('timezone')
  })
  await knex.schema.alterTable('hourly_weather', (table) => {
    table.dropColumn('timezone')
  })
  await knex.schema
    .table('habits', (table) => {
      return table.timestamp('new_date_column')
    })
    .then(() => {
      return knex('habits').update({
        new_date_column: knex.raw('date::timestamp'),
      })
    })
    .then(() => {
      return knex.schema.table('habits', (table) => {
        table.dropColumn('date')
      })
    })
    .then(() => {
      return knex.schema.table('habits', (table) => {
        table.renameColumn('new_date_column', 'date')
      })
    })
}

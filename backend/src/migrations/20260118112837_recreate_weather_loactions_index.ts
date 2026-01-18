import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS hourly_weather_location_index;
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_hourly_weather_location_geog
    ON hourly_weather 
    USING GIST (location);
  `);
  await knex.raw(`
    DROP INDEX IF EXISTS daily_weather_location_index;
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_hourly_weather_location_geog
    ON daily_weather
    USING GIST (location);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_hourly_weather_location_geog;
  `);

  await knex.raw(`
    CREATE INDEX hourly_weather_location_index 
    ON hourly_weather (location);
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_hourly_weather_location_geog;
  `);

  await knex.raw(`
    CREATE INDEX daily_weather_location_index
    ON daily_weather (location);
  `);
}

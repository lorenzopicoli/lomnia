import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX locations_recorded_at_hour_idx
    ON locations (date_trunc('hour', recorded_at AT TIME ZONE 'UTC'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS locations_recorded_at_hour_idx
  `);
}

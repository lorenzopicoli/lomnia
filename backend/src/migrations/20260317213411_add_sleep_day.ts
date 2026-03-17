import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.raw(`
    ALTER TABLE sleeps
    ADD COLUMN sleep_date date
    GENERATED ALWAYS AS (
      (ended_at AT TIME ZONE COALESCE(timezone, 'UTC'))::date
    ) STORED;
  `);

  await knex.raw(`
    CREATE INDEX sleeps_sleep_date_index ON sleeps (sleep_date);
  `);
}

export async function down(knex: Knex) {
  await knex.raw(`
    DROP INDEX IF EXISTS sleeps_sleep_date_index;
  `);

  await knex.raw(`
    ALTER TABLE sleeps DROP COLUMN sleep_date;
  `);
}

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE sleep_stages
    DROP CONSTRAINT sleep_stages_stage_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE sleep_stages
    ADD CONSTRAINT sleep_stages_stage_check
    CHECK (
      stage IN ('awake', 'light', 'deep', 'rem', 'unmeasurable')
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE sleep_stages
    DROP CONSTRAINT sleep_stages_stage_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE sleep_stages
    ADD CONSTRAINT sleep_stages_stage_check
    CHECK (
      stage IN ('awake', 'light', 'deep', 'rem')
    );
  `);
}

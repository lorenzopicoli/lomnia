import type { Knex } from "knex";

// https://github.com/drizzle-team/drizzle-orm/pull/1641
// https://github.com/drizzle-team/drizzle-orm/pull/666
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`UPDATE files SET metadata=(metadata #>> '{}')::jsonb`);
  await knex.raw(`UPDATE locations SET raw_data=(raw_data#>> '{}')::jsonb`);
  await knex.raw(`UPDATE import_jobs SET logs=(logs#>> '{}')::jsonb`);
  await knex.raw(`UPDATE dns_queries SET additional_info=(additional_info#>> '{}')::jsonb`);

  // Files and habits table are unaffected
}

export async function down(knex: Knex): Promise<void> {
  console.log("NO ROLLBACK BABYYYY!!!!");
}

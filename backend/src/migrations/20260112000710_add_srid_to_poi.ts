import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE places_of_interest 
    ALTER COLUMN polygon
    TYPE geometry(Polygon, 4326)
    USING ST_SetSRID(polygon, 4326);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE places_of_interest 
    ALTER COLUMN polygon
    TYPE geometry(Polygon)
    USING polygon;
  `);
}

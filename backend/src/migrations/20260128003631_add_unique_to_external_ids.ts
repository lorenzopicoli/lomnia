import type { Knex } from "knex";

async function deleteDupes(knex: Knex, table: string) {
  await knex.raw(`
    DELETE FROM ${table} t
    USING (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY external_id
            ORDER BY created_at DESC
          ) AS rn
        FROM ${table}
      ) ranked
      WHERE rn > 1
    ) dupes
    WHERE t.id = dupes.id;
                 `);
}

export async function up(knex: Knex): Promise<void> {
  await deleteDupes(knex, "locations");
  await knex.schema.alterTable("locations", (table) => {
    table.unique(["external_id"]);
  });
  await deleteDupes(knex, "device_statuses");
  await knex.schema.alterTable("device_statuses", (table) => {
    table.unique(["external_id"]);
  });
  await deleteDupes(knex, "habits");
  await knex.schema.alterTable("habits", (table) => {
    table.unique(["external_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("locations", (table) => {
    table.dropUnique(["external_id"]);
  });
  await knex.schema.alterTable("device_statuses", (table) => {
    table.dropUnique(["external_id"]);
  });
  await knex.schema.alterTable("external_devices", (table) => {
    table.dropUnique(["external_id"]);
  });
  await knex.schema.alterTable("habits", (table) => {
    table.dropUnique(["external_id"]);
  });
}

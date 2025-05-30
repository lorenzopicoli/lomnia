import type { Knex } from "knex";

const formatAlterTableEnumSql = (tableName: string, columnName: string, enums: string[]) => {
  const constraintName = `${tableName}_${columnName}_check`;
  return [
    `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintName};`,
    `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} CHECK (${columnName} = ANY (ARRAY['${enums.join(
      "'::text, '",
    )}'::text]));`,
  ].join("\n");
};

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    formatAlterTableEnumSql("locations", "source", ["sqlite_locations", "google", "google_new", "owntracks_api"]),
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(formatAlterTableEnumSql("locations", "source", ["sqlite_locations", "google", "google_new"]));
}

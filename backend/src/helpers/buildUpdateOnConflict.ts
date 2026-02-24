import { getTableColumns, type SQL, sql } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";

export function buildUpdateOnConflict<
  TTable extends AnyPgTable,
  TImmutable extends keyof ReturnType<typeof getTableColumns<TTable>>,
>(table: TTable, immutable: readonly TImmutable[]) {
  const columns = getTableColumns(table);
  const alwaysSkip = ["id", "createdAt", "updatedAt"];
  const allSkip = [...immutable, ...alwaysSkip];
  const result: Record<string, SQL> = {};

  for (const key in columns) {
    if (!allSkip.includes(key as string)) {
      const column = columns[key];

      result[key] = sql`excluded.${sql.raw(column.name)}`;
    }
  }

  return result as Omit<{ [K in keyof typeof columns]: SQL }, TImmutable>;
}

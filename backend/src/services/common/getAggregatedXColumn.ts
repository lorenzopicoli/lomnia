import { type SQL, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { type AggregationPeriod, aggregationPeriods } from "../../types/chartTypes";

export function getAggregatedXColumn(col: PgColumn, period?: AggregationPeriod): SQL {
  if (!period) {
    return sql`${col}`;
  }

  // Protect against sql injection
  if (aggregationPeriods.indexOf(period) === -1) {
    return sql`${col}`;
  }

  // Need to use SQL raw so the period isn't a parameter. By doing this psql knows that
  // the selection/order/group are all the same expression
  return sql`DATE_TRUNC('${sql.raw(period)}', ${col})`;
}

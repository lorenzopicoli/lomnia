import { avg, max, min, type SQL, sql, sum } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { AggregationFunction } from "../../types/chartTypes";

export function getAggregatedYColumn(col: PgColumn | SQL, fun?: AggregationFunction): SQL {
  if (!fun) {
    return sql`${col}`;
  }

  switch (fun) {
    case "avg":
      return avg(col);
    case "median":
      return sql`PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY ${col})`;
    case "max":
      return max(col);
    case "min":
      return min(col);
    case "sum":
      return sum(col);
  }
}

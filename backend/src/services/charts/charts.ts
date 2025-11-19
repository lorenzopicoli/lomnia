import { avg, max, min, type SQL, sql, sum } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { isNil } from "lodash";
import { type AggregationFunction, type AggregationPeriod, aggregationPeriods, type ChartServiceReturn } from "./types";

// TODO: Slow
export function getMinMaxChart(
  data: Record<string, { x: number | Date | string; y: number }[]>,
): Awaited<ChartServiceReturn> {
  const keys = Object.keys(data);
  let minX: string | number | Date | undefined;
  let minY: number | undefined;
  let maxX: string | number | Date | undefined;
  let maxY: number | undefined;

  for (const key of keys) {
    const keyData = data[key];
    for (const { x, y } of keyData) {
      if (isNil(minX)) {
        minX = x;
      }
      if (isNil(minY)) {
        minY = y;
      }
      if (isNil(maxX)) {
        maxX = x;
      }
      if (isNil(maxY)) {
        maxY = y;
      }

      if (x < minX!) {
        minX = x;
      }
      if (y < minY!) {
        minY = y;
      }
      if (x > maxX!) {
        maxX = x;
      }
      if (y > maxY!) {
        maxY = y;
      }
    }
  }

  return { minX: minX!, minY: minY!, maxX: maxX!, maxY: maxY!, data };
}

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

import type { DateTime } from "luxon";

export const aggregationPeriods = ["month", "day", "week", "hour"] as const;
export type AggregationPeriod = (typeof aggregationPeriods)[number];
export type AggregationFunction = "avg" | "max" | "min" | "median" | "sum";
export type ChartServiceParams = {
  yKeys: string[];
  xKey: string;
  aggregation?: {
    period: AggregationPeriod;
    fun: AggregationFunction;
  };
  filters: {
    startDate: DateTime;
    endDate: DateTime;
  };
};
export type ChartServiceReturn = Promise<{
  maxX: number | Date | string;
  maxY: number;
  minX: number | Date | string;
  minY: number;
  data: Record<string, { x: number | Date | string; y: number }[]>;
}>;

export type HabitChartServiceParams = ChartServiceParams & {};

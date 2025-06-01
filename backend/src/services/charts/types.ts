import type { DateTime } from "luxon";

export const aggregationPeriods = ["month", "day", "week"] as const;
export type ChartServiceParams = {
  yKeys: string[];
  xKey: string;
  aggregation?: {
    period: (typeof aggregationPeriods)[number];
    fun: "avg" | "max" | "min" | "median";
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

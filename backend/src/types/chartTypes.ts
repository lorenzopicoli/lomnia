import z from "zod";
import { LuxonDateTime } from "./zodTypes";

export const aggregationPeriods = ["hour", "day", "week", "month"] as const;
export const AggregationPeriod = z.enum(aggregationPeriods);
export type AggregationPeriod = z.infer<typeof AggregationPeriod>;

export const aggregationFunctions = ["avg", "median", "max", "min", "sum"] as const;
export const AggregationFunction = z.enum(aggregationFunctions);
export type AggregationFunction = z.infer<typeof AggregationFunction>;

export const AggregationConfig = z.object({
  function: AggregationFunction,
  period: AggregationPeriod,
});

export const DateRange = z.object({
  start: LuxonDateTime,
  end: LuxonDateTime,
});
export type DateRange = z.infer<typeof DateRange>;

export const ChartPeriodInput = z.object({
  ...DateRange.shape,
  aggregationPeriod: AggregationPeriod,
});
export type ChartPeriodInput = z.infer<typeof ChartPeriodInput>;

export const ChartAggregationInput = z.object({
  ...DateRange.shape,
  aggregation: AggregationConfig,
});

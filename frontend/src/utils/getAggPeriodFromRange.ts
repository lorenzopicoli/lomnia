import { differenceInDays } from "date-fns/differenceInDays";
import type { AggregationPeriod } from "../charts/types";

export function getAggPeriodFromRange(range: [Date, Date]) {
  let aggPeriod: AggregationPeriod = "day";
  const daysDiff = Math.abs(differenceInDays(range[0], range[1]));

  if (daysDiff <= 8) {
    aggPeriod = "hour";
  } else if (daysDiff <= 32) {
    aggPeriod = "day";
  } else if (daysDiff <= 800) {
    aggPeriod = "week";
  } else {
    aggPeriod = "month";
  }
  return aggPeriod;
}

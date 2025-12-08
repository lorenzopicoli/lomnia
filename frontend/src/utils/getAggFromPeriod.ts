import type { AggregationPeriod } from "../charts/types";
import type { Period } from "../contexts/DashboardContext";

export function getAggFromPeriod(id: Period) {
  let aggPeriod: AggregationPeriod = "day";
  switch (id) {
    case "all":
      aggPeriod = "month";
      break;
    case "year":
      aggPeriod = "week";
      break;
    case "month":
      aggPeriod = "day";
      break;
    case "week":
      aggPeriod = "hour";
      break;
  }
  return aggPeriod;
}

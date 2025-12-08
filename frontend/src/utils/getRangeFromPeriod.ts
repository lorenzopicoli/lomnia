import { subDays } from "date-fns/subDays";
import type { Period } from "../contexts/DashboardContext";

export function getRangeFromPeriod(id: Period): [Date, Date] {
  const today = new Date();
  switch (id) {
    case "week":
      return [subDays(today, 7), today];
    case "month":
      return [subDays(today, 30), today];
    case "year":
      return [subDays(today, 365), today];
    case "all":
      return [new Date("1970-01-01"), today];
  }
}

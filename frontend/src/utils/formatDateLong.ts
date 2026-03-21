import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

export function formatDateLong(date: string, timezone: string, withTime: boolean = true) {
  return format(new TZDate(date, timezone), `dd MMMM yyyy${withTime ? " HH:mm" : ""}`);
}

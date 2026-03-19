import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

export function formatDate(date: string, timezone: string, withTime: boolean = true) {
  return format(new TZDate(date, timezone), `dd/MM/yyyy${withTime ? " HH:mm" : ""}`);
}

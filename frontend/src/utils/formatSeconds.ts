import { type DurationUnit, formatDuration, intervalToDuration } from "date-fns";

export function formatSeconds(seconds: number, format?: DurationUnit[]): string {
  if (!seconds || seconds < 1) return "0s";

  const duration = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });

  return formatDuration(duration, {
    format: format ?? ["years", "months", "days", "hours"],
    zero: false,
  });
}

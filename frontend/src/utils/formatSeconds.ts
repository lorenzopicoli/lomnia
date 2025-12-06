import { formatDuration, intervalToDuration } from "date-fns";

export function formatSeconds(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";

  const duration = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });

  return formatDuration(duration, {
    format: ["years", "months", "days", "hours"],
    zero: false,
  });
}

import { formatDuration, intervalToDuration } from "date-fns";

export function formatSeconds(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";

  const duration = intervalToDuration({
    start: 0,
    end: seconds * 1000, // date-fns works in ms
  });

  // Remove empty units so you don’t get “0 seconds”
  return formatDuration(duration, {
    format: ["days", "hours", "minutes", "seconds"],
    zero: false,
  });
}

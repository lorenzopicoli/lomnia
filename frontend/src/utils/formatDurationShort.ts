import type { Duration } from "date-fns";

export const formatDurationShort = (d: Duration, opts?: { skipSeconds?: boolean }) => {
  const parts = [];
  if (d.hours) parts.push(`${d.hours}h`);
  if (d.minutes) parts.push(`${d.minutes}m`);
  if (d.seconds && !opts?.skipSeconds) parts.push(`${d.seconds}s`);
  return parts.join(" ");
};

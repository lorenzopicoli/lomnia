export function formatPace(pace: number | null): string | null {
  if (pace == null || !Number.isFinite(pace)) {
    return null;
  }

  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);

  const paddedSeconds = seconds.toString().padStart(2, "0");

  return `${minutes}:${paddedSeconds}/km`;
}

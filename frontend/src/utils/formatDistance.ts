export function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return "0 m";

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;

  // 1 decimal for most cases, 2 if very small km value
  const decimals = km < 10 ? 2 : 1;

  return `${km.toFixed(decimals)} km`;
}

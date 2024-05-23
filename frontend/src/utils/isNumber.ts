export function isNumber(n: unknown): n is number {
  if (n === undefined || n === null) {
    return false
  }
  return Number.isFinite(n)
}

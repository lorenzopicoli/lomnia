export function isNotNill<T>(n: T | undefined | null): n is T {
  if (n === undefined || n === null) {
    return false;
  }
  return true;
}

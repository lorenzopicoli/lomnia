import { isNumber } from "./isNumber";
import get from "lodash/get";

export function getMinMax<
  // Full object, so like { date: Date, weather: WeatherStuff }
  P,
  // Data object, so like WeatherStuff
  T extends Record<string, number | null>,
  // Keys of WeatherStuff
  K extends keyof T = keyof T,
>(data: P[], path: keyof P, keys: K[]) {
  const minMax = data.reduce(
    (acc, curr) => {
      const pathedCurr = get(curr, path) as T;
      for (const key of keys) {
        if (!acc.min[key]) {
          acc.min[key] = { value: pathedCurr[key], entry: curr };
        }
        if (!acc.max[key]) {
          acc.max[key] = { value: pathedCurr[key], entry: curr };
        }
        const pathedValue = pathedCurr[key];

        acc.min[key] =
          isNumber(pathedValue) && pathedValue < (acc.min[key].value ?? Number.MAX_SAFE_INTEGER)
            ? {
                value: pathedValue,
                entry: curr,
              }
            : acc.min[key];
        acc.max[key] =
          isNumber(pathedValue) && pathedValue > (acc.max[key].value ?? Number.MAX_SAFE_INTEGER)
            ? {
                value: pathedValue,
                entry: curr,
              }
            : acc.max[key];
      }
      return acc;
    },
    { min: {}, max: {} } as {
      min: { [key in K]: { value: number | null; entry: P } };
      max: { [key in K]: { value: number | null; entry: P } };
    },
  );
  return minMax;
}

export function getMinMax2<P, T extends Record<string, number | null>, K extends keyof T = keyof T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  path: string,
  keys: K[],
): {
  max: { [key in K]: { value: number; entry: P } };
  min: { [key in K]: { value: number; entry: P } };
} {
  const minMax = data.reduce(
    (acc, curr) => {
      const pathedCurr = get(curr, path) as T;
      for (const key of keys) {
        if (!acc.min[key]) {
          acc.min[key] = { value: pathedCurr[key], entry: curr };
        }
        if (!acc.max[key]) {
          acc.max[key] = { value: pathedCurr[key], entry: curr };
        }
        const pathedValue = pathedCurr[key];

        acc.min[key] =
          isNumber(pathedValue) && pathedValue < acc.min[key].value
            ? {
                value: pathedValue,
                entry: curr,
              }
            : acc.min[key];
        acc.max[key] =
          isNumber(pathedValue) && pathedValue > acc.max[key].value
            ? {
                value: pathedValue,
                entry: curr,
              }
            : acc.max[key];
      }
      return acc;
    },
    { min: {}, max: {} },
  );
  return minMax;
}

import { isValid } from "date-fns";
import { parse } from "date-fns/parse";
import { isNumber } from "./isNumber";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDateLike(value: any): value is Date {
  const possibleDateFormats = [
    "yyyy-MM-dd",
    "yyyy-MM-dd HH:mm:ss+00",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd HH",
    "yyyy-MM-dd HH:mm:ss.SSS",
    "yyyy-MM-dd HH:mm:ss.SSSSSS",
    "yyyy-MM-dd HH:mm:ss.SSSSSSSSS",
    "yyyy-MM-dd HH:mm:ss.SSSSSSSSSSSSSSSSSSS",
    "yyyy-MM-dd HH:mm:ss.S",
  ];
  if (value instanceof Date) {
    return true;
  }
  if (isNumber(value)) {
    return false;
  }
  if (isValid(value)) {
    return true;
  }

  if (typeof value === "string") {
    return possibleDateFormats.some((format) => {
      return isValid(parse(value, format, new Date()));
    });
  }
  return false;
}

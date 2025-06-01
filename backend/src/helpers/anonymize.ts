import { formatISO } from "date-fns";
import { isDate } from "lodash";
import { isISODateString } from "./isISODateString";

function getRandomLetter(upper: boolean): string {
  const alphabet = upper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";
  const randomIndex = Math.floor(Math.random() * alphabet.length);
  return alphabet[randomIndex];
}

function isUpperCase(char: string) {
  return char === char.toUpperCase() && char !== char.toLowerCase();
}

function anonymizeString(data: string) {
  return data
    .split("")
    .map((ch) => {
      const isLetter = /[a-zA-Z]/.test(ch);
      if (isLetter) {
        return getRandomLetter(isUpperCase(ch));
      }

      const isDigit = /\d/.test(ch);
      if (isDigit) {
        return anonymizeNumber(+ch);
      }
      return ch;
    })
    .join("");
}

function anonymizeNumber(data: number) {
  return +[...Array(data.toString().length)].map((_) => (Math.random() * 10) | 0).join("");
}

function anonymizeDate() {
  const start = new Date(2000, 0, 1);
  const end = new Date(3000, 0, 1);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function anonymize<T>(data: T): T {
  if (typeof data === "string") {
    if (isISODateString(data)) {
      return formatISO(anonymizeDate()) as T;
    }
    return anonymizeString(data) as T;
  }

  if (typeof data === "number") {
    return anonymizeNumber(data) as T;
  }

  if (isDate(data)) {
    return anonymizeDate() as T;
  }

  if (typeof data === "boolean") {
    return (Math.random() > 0.5) as T;
  }

  // Maybe something less agressive?
  throw new Error(`Trying to anonymize unknown format ${data}`);
}

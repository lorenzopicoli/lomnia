export function formatHabitValue(habit: {
  value?: any | null;
  valuePrefix?: string | null;
  valueSuffix?: string | null;
}): string {
  const { value, valuePrefix, valueSuffix } = habit;

  if (value === null || value === undefined) {
    return "";
  }

  let formatted: string;

  if (typeof value === "number") {
    formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.00$/, "");
  } else if (typeof value === "boolean") {
    formatted = value ? "Yes" : "No";
  } else if (typeof value === "string") {
    formatted = value.trim();
  } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    if (value.length === 0) {
      formatted = "None";
    } else if (value.length === 1) {
      formatted = value[0];
    } else {
      formatted = `${value.slice(0, -1).join(", ")} and ${value[value.length - 1]}`;
    }
  } else {
    try {
      formatted = JSON.stringify(value);
    } catch {
      formatted = String(value);
    }
  }

  const prefix = valuePrefix ? `${valuePrefix} ` : "";
  const suffix = valueSuffix ? ` ${valueSuffix}` : "";

  return `${prefix}${formatted}${suffix}`.trim();
}

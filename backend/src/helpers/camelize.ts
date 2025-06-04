import camelcaseKeys from "camelcase-keys";

export const camelize = <T extends Record<string, unknown>>(val: T) => camelcaseKeys(val);

import * as countries from "i18n-iso-countries";

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export function getCountryName(code: string) {
  console.log("C", code, countries.getName(code, "en"));
  return countries.getName(code, "en");
}

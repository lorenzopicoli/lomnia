import countries from "i18n-iso-countries";

for (const l of Object.values(countries.langs)) {
  countries.registerLocale(l as any);
}

/**
 * Given a country name, fetch the english name.
 * Useful for nominatim data that includes the local country name and the country code is not very reliable
 */
export function getCountryName(name: string) {
  for (const lang of countries.getSupportedLanguages()) {
    const code = countries.getAlpha2Code(name, lang);
    if (code) {
      return countries.getName(code, "en");
    }
  }
  return null;
}

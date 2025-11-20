import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import config from "../config";
import { type NominatimReverseResponse, NominatimReverseResponseSchema } from "../importers/nominatim/schema";

/**
 * Reverse-geocode a lat/lng and format the response into a unified object.
 *
 * @param name - A custom name you provide (e.g., "Buzzfit")
 * @param lat  - Latitude
 * @param lng  - Longitude
 * @param radiusInMeters - Radius to save into the returned structure
 */
async function reverseGeocodeFormatted(name: string, lat: number, lng: number, radiusInMeters: number) {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        format: "json",
        zoom: 18,
        namedetails: 1,
        extratags: 1,
        lat,
        lon: lng,
      },
      headers: { "User-Agent": config.importers.locationDetails.nominatim.userAgent },
    });

    const parsed: NominatimReverseResponse = NominatimReverseResponseSchema.parse(response.data);

    return {
      name,
      displayName: name,
      radiusInMeters,

      lat,
      lng,

      neighbourhood: parsed.address?.neighbourhood,
      suburb: parsed.address?.suburb,
      city: parsed.address?.city,
      county: parsed.address?.county,
      region: parsed.address?.region,
      state: parsed.address?.state,
      ISO3166_2_lvl4: parsed.address?.["ISO3166-2-lvl4"],
      postcode: parsed.address?.postcode,
      country: parsed.address?.country,
      country_code: parsed.address?.country_code,
    };
  } catch (err) {
    console.log(`Failed to reverse-geocode lat=${lat}, lng=${lng}: ${String(err)}`);
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error(
      "Usage:\n" +
        "  add-poi <name> <lat> <lng> <radiusInMeters>\n" +
        "  add-poi <file.json> <name> <lat> <lng> <radiusInMeters>\n",
    );
    process.exit(1);
  }

  let filePath: string | null = null;
  let name: string;
  let latStr: string;
  let lngStr: string;
  let radiusStr: string;

  if (args[0].endsWith(".json")) {
    filePath = path.resolve(args[0]);
    [name, latStr, lngStr, radiusStr] = args.slice(1);
  } else {
    [name, latStr, lngStr, radiusStr] = args;
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);
  const radius = Number(radiusStr);

  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
    console.error("lat, lng, and radius must be valid numbers");
    process.exit(1);
  }

  const result = await reverseGeocodeFormatted(name, lat, lng, radius);

  if (!result) {
    console.log("No return");
    return;
  }

  if (filePath) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const arr = JSON.parse(raw);

      if (!Array.isArray(arr)) {
        throw new Error("JSON file must contain a single array.");
      }

      arr.push(result);
      await fs.writeFile(filePath, JSON.stringify(arr, null, 2), "utf8");

      console.log(`Added new PoI to ${filePath}`);
    } catch (err) {
      console.error(`Failed to update file: ${err}`);
      process.exit(1);
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

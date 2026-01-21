import { z } from "zod";

export const NominatimAddressSchema = z.object({
  house_number: z.string().optional(),
  road: z.string().optional(),
  neighbourhood: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  town: z.string().optional(),
  village: z.string().optional(),
  county: z.string().optional(),
  region: z.string().optional(),
  state: z.string().optional(),
  "ISO3166-2-lvl4": z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  quarter: z.string().optional(),
  borough: z.string().optional(),
  city_district: z.string().optional(),
  municipality: z.string().optional(),
  state_district: z.string().optional(),
  shop: z.unknown().optional(),
  locality: z.unknown().optional(),
  amenity: z.unknown().optional(),
  craft: z.unknown().optional(),
  railway: z.unknown().optional(),
});

export const NominatimReverseResponseSchema = z
  .object({
    error: z.any(),
    place_id: z.number().optional(),
    licence: z.string().optional(),
    osm_type: z.enum(["node", "way", "relation"]).optional(),
    osm_id: z.number().optional(),
    lat: z.string().optional(),
    lon: z.string().optional(),
    class: z.string().optional(),
    type: z.string().optional(),
    place_rank: z.number().optional(),
    importance: z.number().optional(),
    addresstype: z.string().optional(),
    name: z.string().optional(),
    display_name: z.string().optional(),
    address: NominatimAddressSchema.optional(),
    extratags: z.record(z.string(), z.string()).nullable().optional(),
    namedetails: z.record(z.string(), z.string()).nullable().optional(),
    boundingbox: z.array(z.string()).length(4).optional(),
  })
  .strict();

export type NominatimReverseResponse = z.infer<typeof NominatimReverseResponseSchema>;
export type NominatimAddress = z.infer<typeof NominatimAddressSchema>;

export const PlaceSchema = z.object({
  placeId: z.string().optional(),
  licence: z.string().optional(),
  osmType: z.string().optional(),
  osmId: z.string().optional(),

  placeRank: z.number().optional(),
  category: z.string().optional(),
  type: z.string().optional(),

  importance: z.string().optional(),

  addressType: z.string().optional(),
  displayName: z.string().optional(),

  extraTags: z.record(z.string(), z.unknown()).optional().nullable(),
  nameDetails: z.record(z.string(), z.unknown()).optional().nullable(),

  // you default this to ""
  name: z.string(),

  houseNumber: z.string().optional(),
  road: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  region: z.string().optional(),
  state: z.string().optional(),

  iso3166_2_lvl4: z.string().optional(),

  postcode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
});

export type ReverseGeocodedPlace = z.infer<typeof PlaceSchema>;

export function mapNominatimApiResponseToPlace(apiResponse: NominatimReverseResponse): ReverseGeocodedPlace {
  return {
    placeId: apiResponse.place_id?.toString(),
    licence: apiResponse.licence,
    osmType: apiResponse.osm_type,
    osmId: apiResponse.osm_id?.toString(),
    placeRank: apiResponse.place_rank,
    category: apiResponse.class,
    type: apiResponse.type,
    importance: String(apiResponse.importance),
    addressType: apiResponse.addresstype,
    displayName: apiResponse.display_name,
    extraTags: apiResponse.extratags ?? undefined,
    nameDetails: apiResponse.namedetails ?? undefined,
    name: apiResponse.name ?? "",
    houseNumber: apiResponse.address?.house_number,
    road: apiResponse.address?.road,
    suburb: apiResponse.address?.suburb,
    city: apiResponse.address?.city,
    county: apiResponse.address?.county,
    region: apiResponse.address?.region,
    state: apiResponse.address?.state,
    iso3166_2_lvl4: apiResponse.address?.["ISO3166-2-lvl4"],
    postcode: apiResponse.address?.postcode,
    country: apiResponse.address?.country,
    countryCode: apiResponse.address?.country_code,
  };
}

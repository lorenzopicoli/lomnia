import { z } from "zod";

export const NominatimAddressSchema = z
  .object({
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
  })
  .strict();

export const NominatimReverseResponseSchema = z
  .object({
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
    extratags: z.record(z.string()).nullable().optional(),
    namedetails: z.record(z.string()).nullable().optional(),
    boundingbox: z.array(z.string()).length(4).optional(),
  })
  .strict();

export type NominatimReverseResponse = z.infer<typeof NominatimReverseResponseSchema>;
export type NominatimAddress = z.infer<typeof NominatimAddressSchema>;

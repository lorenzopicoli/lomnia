import { z } from "zod";

const TriggerType = z.enum(["p", "c", "C", "b", "r", "u", "t", "v"]);

const ConnectivityStatus = z.enum(["w", "o", "m"]);

export const OwnTracksLocationSchema = z
  .object({
    _type: z.literal("location"),

    /**
     * Latitude in degrees
     */
    lat: z.number().min(-90).max(90),
    /**
     * Longitude in degrees
     */
    lon: z.number().min(-180).max(180),
    /**
     * Timestamp in UNIX format (epoch)
     */
    tst: z.number().int().positive(),

    /**
     * Accuracy in meters
     */
    acc: z.number().int().optional(),
    /**
     * Altitude in meters
     */
    alt: z.number().int().optional(),
    /**
     * Battery percentage
     */
    batt: z.number().int().min(0).max(100).optional(),
    /**
     * Battery status
     * Battery Status 0=unknown, 1=unplugged, 2=charging, 3=full
     */
    bs: z.number().int().min(0).max(3).optional(),
    /**
     * Course over ground in degrees
     */
    cog: z.number().int().optional(),
    /**
     * Radius in meters
     */
    rad: z.number().int().positive().optional(),
    /**
     * Trigger type
     * p ping issued randomly by background task (iOS,Android)
     * c circular region enter/leave event (iOS,Android)
     * C circular region enter/leave event for +follow regions (iOS)
     * b beacon region enter/leave event (iOS)
     * r response to a reportLocation cmd message (iOS,Android)
     * u manual publish requested by the user (iOS,Android)
     * t timer based publish in move move (iOS)
     * v updated by Settings/Privacy/Locations Services/System Services/Frequent Locations monitoring (iOS)
     */
    t: TriggerType.optional(),
    /**
     * Tracker ID
     */
    tid: z.string().optional(),
    /**
     * Vertical accuracy in meters
     */
    vac: z.number().int().optional(),
    /**
     * Velocity in km/h
     */
    vel: z.number().int().min(0).optional(),

    // Extended data fields (only if extendedData=true)
    /**
     * Barometric pressure in kPa
     */
    p: z.number().optional(),
    /**
     * Connectivity status
     *
     * w phone is connected to a WiFi connection (iOS,Android)
     * o phone is offline (iOS,Android)
     * m mobile data (iOS,Android)
     */
    conn: ConnectivityStatus.optional(),

    // iOS specific fields
    /**
     * Point of interest name
     */
    poi: z.string().optional(),
    /**
     * Base64 encoded image
     */
    image: z.string().optional(),
    /**
     * Image name
     */
    imagename: z.string().optional(),
    /**
     * Tag name
     */
    tag: z.string().optional(),
    /**
     * WiFi network name
     */
    SSID: z.string().optional(),
    /**
     * WiFi access point identifier
     */
    BSSID: z.string().optional(),
    m: z.number().int().min(1).max(2).optional(),

    // Region fields
    /**
     * List of region names
     */
    inregions: z.array(z.string()).optional(),
    /**
     * List of region IDs
     */
    inrids: z.array(z.string()).optional(),

    // HTTP mode fields
    /**
     * Original publish topic
     */
    topic: z.string().optional(),

    // Android specific fields
    /**
     * Random identifier
     */
    _id: z.string().optional(),

    // Timestamp fields
    /**
     * Message creation timestamp (epoch)
     */
    created_at: z.number().int().positive().optional(),
    /**
     * Received timestamp in ISO format (UTC)
     */
    isorcv: z.string().optional(),
    /**
     * Publish timestamp in ISO format (UTC)
     */
    isotst: z.string().optional(),
    /**
     * Publish timestamp in display format
     */
    disptst: z.string().optional(),
    /**
     * Timezone name (e.g. "Europe/Berlin")
     */
    tzname: z.string().optional(),
    /**
     * Hash that represents the location
     */
    ghash: z.string().optional(),
    /**
     * Date/time in the user timezone (eg. "2025-01-14T18:43:09-0500")
     */
    isolocal: z.string().optional(),

    _http: z.boolean().optional(),
  })
  .strict();

export type OwnTracksLocation = z.infer<typeof OwnTracksLocationSchema>;

export const OwnTracksLocationApiResponseSchema = z
  .object({
    count: z.number().optional(),
    data: z.array(OwnTracksLocationSchema),
    status: z.number(),
    version: z.string(),
  })
  .strict();
export type OwnTracksLocationApiResponse = z.infer<typeof OwnTracksLocationApiResponseSchema>;

export function parseOwnTracksLocation(data: unknown): OwnTracksLocation {
  return OwnTracksLocationSchema.parse(data);
}

export function safeParseOwnTracksLocation(data: unknown) {
  return OwnTracksLocationSchema.safeParse(data);
}

export function parseOwnTracksApiResponse(data: unknown): OwnTracksLocationApiResponse {
  return OwnTracksLocationApiResponseSchema.parse(data);
}

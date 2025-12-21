import * as z from "zod";

const LocationPointSchema = z.object({
  lat: z.number().meta({
    description: "Latitude of the location",
  }),
  lng: z.number().meta({
    description: "Longitude of the location",
  }),
});

export default z
  .object({
    entityType: z.literal("location").meta({
      description: "Entity discriminator",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),

    id: z
      .string()
      .meta({
        description: "Unique identifier for the location record. Must be stable across multiple extractions",
      })
      .optional(),

    deviceId: z
      .string()
      .meta({
        description: "The device that recorded this",
      })
      .optional(),

    source: z.string().meta({
      description: "The application source used to get this location",
    }),

    gpsSource: z
      .enum(["network", "gps", "fused"])
      .meta({
        description: "The hardware source used to get this location in the device (e.g., network, gps, fused)",
      })
      .optional(),

    accuracy: z
      .number()
      .meta({
        description: "Accuracy of the location in meters",
      })
      .optional(),

    verticalAccuracy: z
      .number()
      .meta({
        description: "Vertical accuracy in meters",
      })
      .optional(),

    velocity: z
      .number()
      .meta({
        description: "Velocity in km/h",
      })
      .optional(),

    altitude: z
      .number()
      .meta({
        description: "Altitude in meters",
      })
      .optional(),

    location: LocationPointSchema.meta({
      description: "Geographic point",
    }),

    trigger: z
      .enum(["ping", "circular", "report_location", "manual"])
      .meta({
        description: "What triggered this location update",
      })
      .optional(),

    topic: z
      .string()
      .meta({
        description: "Topic associated with this location",
      })
      .optional(),

    timezone: z.string().meta({
      description: "The user timezone at the time of location recording",
    }),

    recordedAt: z.iso.datetime().meta({
      description: "The date at which the location was taken, in UTC time",
    }),
  })
  .meta({
    title: "Location",
    description: "Represents a geographic location entry with associated metadata",
  });

export const fileName = "location.schema.json";

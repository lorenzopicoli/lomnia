import * as z from "zod";

export const IngestionHeartRate = z
  .object({
    entityType: z.literal("heartRate").meta({
      description: "Entity discriminator",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),

    id: z.string().meta({
      description: "Unique identifier for the record. Must be stable across multiple extractions",
    }),

    source: z.string().meta({
      description: "The application source used to get this",
    }),

    deviceId: z
      .string()
      .meta({
        description: "Unique identifier for the device linked to this record",
      })
      .optional(),

    recordedAt: z.iso.datetime().meta({
      description: "The date at which the hr was recorded, in UTC time",
    }),

    heartRate: z.number().meta({
      description: "The heart rate",
    }),

    timezone: z
      .string()
      .meta({
        description: "The user timezone",
      })
      .optional(),
  })
  .meta({
    title: "Heart Rate",
    description: "Represents the user's heart rate at a certain time",
  });

export default IngestionHeartRate;
export type IngestionHeartRate = z.infer<typeof IngestionHeartRate>;
export const fileName = "heart_rate.schema.json";

import * as z from "zod";

export const Sleep = z
  .object({
    entityType: z.literal("sleep").meta({
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

    startedAt: z.iso.datetime().meta({
      description: "The date at which the sleep started, in UTC time",
    }),

    endedAt: z.iso.datetime().meta({
      description: "The date at which the sleep ended, in UTC time",
    }),

    automaticScore: z.number().min(0).max(100).meta({
      description: "Automatic score given by the source",
    }),

    userScore: z.number().min(0).max(100).meta({
      description: "Automatic score given by the source",
    }),

    deviceId: z.string().meta({
      description: "Unique identifier for the device linked to this record",
    }),
  })
  .meta({
    title: "Sleep",
    description: "Represents a period of sleep",
  });

export default IngestionSleep;
export type IngestionSleep = z.infer<typeof Sleep>;
export const fileName = "sleep.schema.json";

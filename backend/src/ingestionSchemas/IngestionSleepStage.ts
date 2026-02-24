import * as z from "zod";

export const SleepStageType = z.enum(["awake", "rem", "light", "deep"]);

export const IngestionSleepStage = z
  .object({
    entityType: z.literal("sleepStage").meta({
      description: "Entity discriminator",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),

    id: z.string().meta({
      description: "Unique identifier for the record. Must be stable across multiple extractions",
    }),

    sleepId: z.string().meta({
      description: "Unique identifier for the sleep record. Must be stable across multiple extractions",
    }),

    source: z.string().meta({
      description: "The application source used to get this",
    }),

    startedAt: z.iso.datetime().meta({
      description: "The date at which the stage started, in UTC time",
    }),

    endedAt: z.iso.datetime().meta({
      description: "The date at which the stage ended, in UTC time",
    }),

    timezone: z
      .string()
      .meta({
        description: "The user timezone",
      })
      .optional(),

    type: SleepStageType.meta({
      description: "The stage for this period",
    }),

    deviceId: z
      .string()
      .meta({
        description: "Unique identifier for the device linked to this record",
      })
      .optional(),
  })
  .meta({
    title: "Sleep Stage",
    description: "Represents a stage of sleep (ie. rem, light, awake, etc...)",
  });

export default IngestionSleepStage;
export type IngestionSleepStage = z.infer<typeof IngestionSleepStage>;
export const fileName = "sleep_stage.schema.json";

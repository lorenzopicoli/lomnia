import * as z from "zod";

export const SleepStageType = z.enum(["awake", "rem", "light", "deep"]);

export const SleepStage = z
  .object({
    entityType: z.literal("sleepStages").meta({
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
      description: "The date at which the stage started, in UTC time",
    }),

    endedAt: z.iso.datetime().meta({
      description: "The date at which the stage ended, in UTC time",
    }),

    type: SleepStageType.meta({
      description: "The stage for this period",
    }).optional(),

    deviceId: z.string().meta({
      description: "Unique identifier for the device linked to this record",
    }),
  })
  .meta({
    title: "Sleep",
    description: "Represents a period of sleep",
  });

export default IngestionSleepStage;
export type IngestionSleepStage = z.infer<typeof SleepStage>;
export const fileName = "sleep_stage.schema.json";

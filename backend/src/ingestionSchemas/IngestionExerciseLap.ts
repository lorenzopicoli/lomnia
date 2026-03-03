import * as z from "zod";

export const IngestionExerciseLap = z
  .object({
    entityType: z.literal("exerciseLap").meta({
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
      description: "The date at which the lap started, in UTC time",
    }),

    endedAt: z.iso.datetime().meta({
      description: "The date at which the lap ended, in UTC time",
    }),

    distance: z
      .number()
      .meta({
        description: "Total distance travelled during the lap",
      })
      .optional(),

    duration: z
      .number()
      .meta({
        description: "Duration for this lap",
      })
      .optional(),

    avgPace: z
      .number()
      .meta({
        description: "Average pace in minute per kilometer",
      })
      .optional(),

    avgHeartRate: z
      .number()
      .meta({
        description: "Average heart rate during the exercise",
      })
      .optional(),

    exerciseId: z.string().meta({
      description: "The exercise this lap belongs to",
    }),

    timezone: z
      .string()
      .meta({
        description: "The user timezone",
      })
      .optional(),

    deviceId: z
      .string()
      .meta({
        description: "Unique identifier for the device linked to this record",
      })
      .optional(),
  })
  .meta({
    title: "Exercise metrics",
    description: "Extra metrics recorded during an exercise",
  });

export default IngestionExerciseLap;
export type IngestionExerciseLap = z.infer<typeof IngestionExerciseLap>;
export const fileName = "exercise_lap.schema.json";

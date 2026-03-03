import * as z from "zod";

export const IngestionExerciseMetrics = z
  .object({
    entityType: z.literal("exerciseMetrics").meta({
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

    pace: z
      .number()
      .meta({
        description: "The pace at a given point of the exercise",
      })
      .optional(),

    cadence: z
      .number()
      .meta({
        description: "The cadence at a given point of the exercise",
      })
      .optional(),

    verticalOscillation: z
      .number()
      .meta({
        description: "Vertical oscillation at a given point of the exercise",
      })
      .optional(),

    speed: z
      .number()
      .meta({
        description: "Speed at a given point of the exercise",
      })
      .optional(),

    stepLength: z
      .number()
      .meta({
        description: "Step length at a given point of the exercise",
      })
      .optional(),

    stanceTime: z
      .number()
      .meta({
        description: "Ground contact time at a given point of the exercise",
      })
      .optional(),

    exerciseId: z.string().meta({
      description: "The exercise this metric belongs to",
    }),

    recordedAt: z.iso.datetime().meta({
      description: "The date at which the sleep started, in UTC time",
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

export default IngestionExerciseMetrics;
export type IngestionExerciseMetrics = z.infer<typeof IngestionExerciseMetrics>;
export const fileName = "exercise_metrics.schema.json";

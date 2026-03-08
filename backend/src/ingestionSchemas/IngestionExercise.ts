import * as z from "zod";

export const ExerciseTypeEnum = z.enum(["running", "strength_training", "volleyball", "cycling", "yoga", "generic"]);

export const IngestionExercise = z
  .object({
    entityType: z.literal("exercise").meta({
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
      description: "The date at which the exercise started, in UTC time",
    }),

    endedAt: z.iso.datetime().meta({
      description: "The date at which the eexercise nded, in UTC time",
    }),

    exerciseType: ExerciseTypeEnum.meta({
      description: "The exercise that was done",
    }),

    name: z.string().meta({
      description: "The name given to this exercise",
    }),

    distance: z
      .number()
      .meta({
        description: "Total distance travelled during the exercise",
      })
      .optional(),

    avgPace: z
      .number()
      .meta({
        description: "Average pace in minute per kilometer",
      })
      .optional(),

    avgCadence: z
      .number()
      .meta({
        description: "Average cadence in steps per min",
      })
      .optional(),

    avgHeartRate: z
      .number()
      .meta({
        description: "Average heart rate during the exercise",
      })
      .optional(),

    selfEvaluation: z
      .number()
      .min(0)
      .max(10)
      .meta({
        description: "Self evaluation out of 10",
      })
      .optional(),

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
    title: "Exercise",
  });

export default IngestionExercise;
export type IngestionExercise = z.infer<typeof IngestionExercise>;
export const fileName = "exercise.schema.json";

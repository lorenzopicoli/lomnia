import * as z from "zod";

export const ExerciseTypeEnum = z.enum([
  "running",
  "strength_training",
  "volleyball",
  "cycling",
  "yoga",
  "generic",
  "fitness_equipment",
]);

export const IngestionExerciseLap = z
  .object({
    startedAt: z.iso.datetime().meta({
      description: "The date at which the lap started, in UTC time",
    }),

    endedAt: z.iso.datetime().meta({
      description: "The date at which the lap ended, in UTC time",
    }),

    distance: z
      .number()
      .meta({
        description: "Total distance travelled in this lap",
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

    maxPace: z
      .number()
      .meta({
        description: "Max pace in minute per kilometer",
      })
      .optional(),

    avgHeartRate: z
      .number()
      .meta({
        description: "Average heart rate during the exercise",
      })
      .optional(),

    maxHeartRate: z
      .number()
      .meta({
        description: "Max heart rate during the exercise",
      })
      .optional(),

    avgCadence: z
      .number()
      .meta({
        description: "Average cadence in steps per minute",
      })
      .optional(),

    maxCadence: z
      .number()
      .meta({
        description: "Max cadence in steps per minute",
      })
      .optional(),

    avgStepLength: z
      .number()
      .meta({
        description: "Average step length",
      })
      .optional(),

    avgStanceTime: z
      .number()
      .meta({
        description: "Ground contact time throughout the lap",
      })
      .optional(),

    avgVerticalOscillation: z
      .number()
      .meta({
        description: "Vertical oscillation",
      })
      .optional(),
  })
  .meta({
    title: "Exercise metrics",
    description: "Extra metrics recorded during an exercise",
  });

export const IngestionExerciseMetrics = z
  .object({
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

    distance: z
      .number()
      .meta({
        description: "Distance travelled up until this time",
      })
      .optional(),

    recordedAt: z.iso.datetime().meta({
      description: "The date at which the sleep started, in UTC time",
    }),
  })
  .meta({
    title: "Exercise metrics",
    description: "Extra metrics recorded during an exercise",
  });

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

    laps: z.array(IngestionExerciseLap).meta({ description: "Laps recorded in this exercise" }).optional(),

    metrics: z.array(IngestionExerciseMetrics).meta({ description: "Metrics recored in this exercise" }).optional(),
  })
  .meta({
    title: "Exercise",
  });

export default IngestionExercise;
export type IngestionExercise = z.infer<typeof IngestionExercise>;
export const fileName = "exercise.schema.json";

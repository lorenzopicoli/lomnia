import * as z from "zod";

const HabitValueSchema = z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()]);

export const PeriodOfDayEnum = z.enum(["morning", "afternoon", "evening", "over_night"]);

export const IngestionHabit = z
  .object({
    entityType: z.literal("habit").meta({
      description: "Entity discriminator",
    }),

    version: z.string().meta({
      description: "Version of the schema used for this habit record",
    }),

    id: z
      .string()
      .meta({
        description:
          "Stable identifier for the habit record. Optional but should be stable across re-imports if provided",
      })
      .optional(),

    key: z.string().meta({
      description: "Logical habit key (domain identifier)",
    }),

    value: HabitValueSchema.meta({
      description: "Recorded habit value. Must be a primitive (string list, number, boolean, or null)",
    }),

    valuePrefix: z.string().meta({
      description: "The prefix to use when displaying the value",
    }),

    valueSuffix: z.string().meta({
      description: "The suffix to use when displaying the value",
    }),

    date: z.iso.datetime().meta({
      description: "Date when the habit occurred (time may be discarded depending on other properties). In UTC",
    }),

    source: z.string().meta({
      description: "Logical source where the habit was recorded (e.g. obsidian, hares, etc)",
    }),

    timezone: z.string().meta({
      description: "User timezone at the time the habit was recorded",
    }),

    comments: z
      .string()
      .meta({
        description: "Optional user comments or notes for this habit",
      })
      .optional(),

    recordedAt: z.iso.datetime().meta({
      description: "Exact timestamp when the habit was recorded, if available. In UTC",
    }),

    periodOfDay: PeriodOfDayEnum.meta({
      description: "Part of the day when the habit occurred, if applicable",
    }).optional(),

    isFullDay: z
      .boolean()
      .meta({
        description: "If true, the habit spans the full day and the time portion of the date should be ignored",
      })
      .optional(),
  })
  .meta({
    title: "Habit",
    description: "Represents a habit record",
  });

export default IngestionHabit;

export type IngestionHabit = z.infer<typeof IngestionHabit>;

export const fileName = "habit.schema.json";

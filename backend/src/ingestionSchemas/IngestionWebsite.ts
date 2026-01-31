import * as z from "zod";

export const IngestionWebsite = z
  .object({
    entityType: z.literal("website").meta({
      description: "Entity discriminator",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),

    id: z.string().meta({
      description: "Unique identifier for the location record. Must be stable across multiple extractions",
    }),

    source: z.string().meta({
      description: "The application source used to get this",
    }),

    url: z.string().meta({
      description: "The URL of the website",
    }),

    host: z
      .string()
      .meta({
        description: "The host part of the URL",
      })
      .optional(),

    title: z
      .string()
      .meta({
        description: "The title of the website",
      })
      .optional(),

    description: z
      .string()
      .meta({
        description: "The description of the website",
      })
      .optional(),

    previewImageUrl: z
      .string()
      .meta({
        description: "The preview image of the website",
      })
      .optional(),

    recordedAt: z.iso
      .datetime()
      .meta({
        description: "The date at which the website was recorded, in UTC time",
      })
      .optional(),
  })
  .meta({
    title: "Website",
    description: "Represents a website",
  });

export default IngestionWebsite;
export type IngestionWebsite = z.infer<typeof IngestionWebsite>;
export const fileName = "website.schema.json";

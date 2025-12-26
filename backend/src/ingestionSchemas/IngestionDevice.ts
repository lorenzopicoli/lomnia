import * as z from "zod";

export const IngestionDevice = z
  .object({
    entityType: z.literal("device").meta({
      description: "Entity discriminator",
    }),

    id: z.string().meta({
      description: "Unique identifier for the device",
    }),

    source: z.string().meta({
      description: "The application source used to get this device",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),
  })
  .meta({
    title: "Device",
    description: "Represents a device with associated metadata",
  });

export default IngestionDevice;
export type IngestionDevice = z.infer<typeof IngestionDevice>;
export const fileName = "device.schema.json";

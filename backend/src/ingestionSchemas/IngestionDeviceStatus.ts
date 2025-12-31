import * as z from "zod";

export const IngestionDeviceStatus = z
  .object({
    entityType: z.literal("deviceStatus").meta({
      description: "Entity discriminator",
    }),

    deviceId: z.string().meta({
      description: "Unique identifier for the device linked to this status",
    }),

    id: z
      .string()
      .nullable()
      .meta({
        description: "External identifier from the source system",
      })
      .optional(),

    source: z.string().meta({
      description: "The application source used to get this device status",
    }),

    battery: z
      .number()
      .meta({
        description: "Battery level in percent",
      })
      .optional(),

    batteryStatus: z
      .enum(["unknown", "unplugged", "charging", "full"])
      .meta({
        description: "Current battery status",
      })
      .optional(),

    connectionStatus: z
      .enum(["wifi", "offline", "cellular", "ethernet"])
      .meta({
        description: "Current connection status",
      })
      .optional(),

    trigger: z
      .enum(["ping", "circular", "report_location", "manual"])
      .meta({
        description: "What triggered this device status update",
      })
      .optional(),

    timezone: z.string().meta({
      description: "The user timezone at the time of device status recording",
    }),

    wifiSSID: z
      .string()
      .meta({
        description: "WiFi network name if connected via WiFi",
      })
      .optional(),

    recordedAt: z.iso.datetime().meta({
      description: "The date at which the device status was taken, in UTC time",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),
  })
  .meta({
    title: "DeviceStatus",
    description: "Represents an event of a change of status of a device",
  });

export default IngestionDeviceStatus;
export type IngestionDeviceStatus = z.infer<typeof IngestionDeviceStatus>;
export const fileName = "deviceStatus.schema.json";

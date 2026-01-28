import { type SQL, sql } from "drizzle-orm";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDeviceStatus from "../../ingestionSchemas/IngestionDeviceStatus";
import { deviceStatusTable, type NewDeviceStatus } from "../../models/DeviceStatus";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class DeviceStatusIngester extends Ingester<IngestionDeviceStatus, NewDeviceStatus> {
  protected logger = new Logger("DeviceStatusIngester");

  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionDeviceStatus } {
    const parsed = ingestionSchemas.deviceStatus.safeParse(raw);

    return {
      isIngestable: parsed.success,
      parsed: parsed.data,
    };
  }

  transform(raw: IngestionDeviceStatus): NewDeviceStatus {
    const transformed: NewDeviceStatus = {
      externalId: raw.id,

      externalDeviceId: raw.deviceId,

      battery: raw.battery,
      batteryStatus: raw.batteryStatus,
      connectionStatus: raw.connectionStatus,
      wifiSSID: raw.wifiSSID,

      source: raw.source,
      timezone: raw.timezone,
      importJobId: this.importJobId,
      recordedAt: new Date(raw.recordedAt),
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    // Setting it like this to force new properties to be considered for update on conflict.
    const updateOnConflict: Omit<{ [key in keyof NewDeviceStatus]: SQL }, "importJobId"> = {
      battery: sql`excluded.battery`,
      batteryStatus: sql`excluded.battery_status`,
      connectionStatus: sql`excluded.connection_status`,
      wifiSSID: sql`excluded.wifi_ssid`,

      source: sql`excluded.source`,
      timezone: sql`excluded.timezone`,
    };
    await this.tx.insert(deviceStatusTable).values(this.collected).onConflictDoUpdate({
      target: deviceStatusTable.externalId,
      set: updateOnConflict,
    });
  }
}

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
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    await this.tx.insert(deviceStatusTable).values(this.collected);
  }
}

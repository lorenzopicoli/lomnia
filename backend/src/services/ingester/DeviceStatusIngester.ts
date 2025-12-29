import type { DBTransaction } from "../../db/types";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDeviceStatus from "../../ingestionSchemas/IngestionDeviceStatus";
import type { NewDeviceStatus } from "../../models/DeviceStatus";
import { Ingester } from "./BaseIngester";

export class DeviceStatusIngester extends Ingester<IngestionDeviceStatus> {
  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionDeviceStatus } {
    const location = ingestionSchemas.deviceStatus.safeParse(raw);

    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }

  private transform(raw: IngestionDeviceStatus): NewDeviceStatus {
    const transformed: NewDeviceStatus = {
      externalId: raw.id,

      deviceId: raw.deviceId,

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

  public async ingest(_tx: DBTransaction, parsed: IngestionDeviceStatus) {
    const newDeviceStatus = this.transform(parsed);
    console.log("Transforming device status", newDeviceStatus);
    // await tx.insert(locationsTable).values(parsed);
    return true;
  }
}

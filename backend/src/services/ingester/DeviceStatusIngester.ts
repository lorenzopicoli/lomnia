import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDeviceStatus from "../../ingestionSchemas/IngestionDeviceStatus";
import { deviceStatusTable, type NewDeviceStatus } from "../../models/DeviceStatus";
import type { Exhaustive } from "../../types/exhaustive";
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
    const {
      id,
      deviceId,
      battery,
      batteryStatus,
      temperature,
      connectionStatus,
      wifiSSID,
      source,
      timezone,
      recordedAt,
      // Unused
      entityType: _type,
      version: _version,
      trigger: _trigger,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewDeviceStatus = {
      externalId: id,

      externalDeviceId: deviceId,

      battery,
      batteryStatus,
      temperature,
      connectionStatus,
      wifiSSID,

      source,
      timezone,

      importJobId: this.importJobId,
      recordedAt: new Date(recordedAt),
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(deviceStatusTable, ["importJobId", "createdAt"]);
    await this.tx.insert(deviceStatusTable).values(this.collected).onConflictDoUpdate({
      target: deviceStatusTable.externalId,
      set: updateOnConflict,
    });
  }
}

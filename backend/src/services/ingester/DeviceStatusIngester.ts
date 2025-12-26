import type { DBTransaction } from "../../db/types";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDeviceStatus from "../../ingestionSchemas/IngestionDeviceStatus";
import { Ingester } from "./BaseIngester";

export class DeviceStatusIngester extends Ingester<IngestionDeviceStatus> {
  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionDeviceStatus } {
    const location = ingestionSchemas.deviceStatus.safeParse(raw);

    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }

  public async ingest(_tx: DBTransaction, raw: IngestionDeviceStatus) {
    console.log("Transforming device status", raw);
    // await tx.insert(locationsTable).values(parsed);
  }
}

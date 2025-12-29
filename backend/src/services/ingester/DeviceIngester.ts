import type { DBTransaction } from "../../db/types";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDevice from "../../ingestionSchemas/IngestionDevice";
import type { NewExternalDevice } from "../../models/ExternalDevice";
import { Ingester } from "./BaseIngester";

export class DeviceIngester extends Ingester<IngestionDevice> {
  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionDevice } {
    const location = ingestionSchemas.device.safeParse(raw);

    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }
  private transform(raw: IngestionDevice): NewExternalDevice {
    const transformed: NewExternalDevice = {
      externalId: raw.id,

      source: raw.source,
      importJobId: this.importJobId,
    };

    return transformed;
  }

  public async ingest(_tx: DBTransaction, parsed: IngestionDevice) {
    const newDeviceStatus = this.transform(parsed);
    console.log("Transforming device status", newDeviceStatus);
    // await tx.insert(locationsTable).values(parsed);
    return true;
  }
}

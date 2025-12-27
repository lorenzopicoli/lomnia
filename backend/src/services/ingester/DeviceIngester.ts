import type { DBTransaction } from "../../db/types";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDevice from "../../ingestionSchemas/IngestionDevice";
import { Ingester } from "./BaseIngester";

export class DeviceIngester extends Ingester<IngestionDevice> {
  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionDevice } {
    const location = ingestionSchemas.device.safeParse(raw);

    return {
      isIngestable: location.success,
      parsed: location.data,
    };
  }

  public async ingest(_tx: DBTransaction, raw: IngestionDevice) {
    console.log("Transforming device", raw);
    // await tx.insert(locationsTable).values(parsed);
    return true;
  }
}

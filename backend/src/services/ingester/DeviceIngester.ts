import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDevice from "../../ingestionSchemas/IngestionDevice";
import { externalDevicesTable, type NewExternalDevice } from "../../models/ExternalDevice";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class DeviceIngester extends Ingester<IngestionDevice, NewExternalDevice> {
  protected logger = new Logger("DeviceIngester");

  public isIngestable(raw: unknown): { isIngestable: boolean; parsed?: IngestionDevice } {
    const parsed = ingestionSchemas.device.safeParse(raw);

    return {
      isIngestable: parsed.success,
      parsed: parsed.data,
    };
  }
  transform(raw: IngestionDevice): NewExternalDevice {
    const transformed: NewExternalDevice = {
      externalId: raw.id,

      source: raw.source,
      importJobId: this.importJobId,
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    await this.tx.insert(externalDevicesTable).values(this.collected);
  }
}

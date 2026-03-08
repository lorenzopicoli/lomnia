import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionDevice from "../../ingestionSchemas/IngestionDevice";
import { externalDevicesTable, type NewExternalDevice } from "../../models/ExternalDevice";
import type { Exhaustive } from "../../types/exhaustive";
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
    const {
      id,
      name,
      source,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewExternalDevice = {
      externalId: id,

      name,
      source,

      importJobId: this.importJobId,
      createdAt: new Date(),
    };

    return transformed;
  }
  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(externalDevicesTable, ["importJobId", "createdAt"]);
    await this.tx.insert(externalDevicesTable).values(this.collected).onConflictDoUpdate({
      target: externalDevicesTable.externalId,
      set: updateOnConflict,
    });
  }
}

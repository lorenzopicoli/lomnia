import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionWebsite from "../../ingestionSchemas/IngestionWebsite";
import { type NewWebsite, websitesTable } from "../../models/Website";
import type { Exhaustive } from "../../types/exhaustive";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class WebsiteIngester extends Ingester<IngestionWebsite, NewWebsite> {
  protected logger = new Logger("WebsiteIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionWebsite;
  } {
    const website = ingestionSchemas.website.safeParse(raw);
    return {
      isIngestable: website.success,
      parsed: website.data,
    };
  }

  transform(raw: IngestionWebsite): NewWebsite {
    const {
      id,
      source,
      url,
      host,
      title,
      description,
      previewImageUrl,
      recordedAt,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewWebsite = {
      externalId: id,

      source,
      url,
      host,
      title,
      description,
      previewImageUrl,

      importJobId: this.importJobId,
      recordedAt: recordedAt ? new Date(recordedAt) : null,
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(websitesTable, ["importJobId", "createdAt"]);
    await this.tx.insert(websitesTable).values(this.collected).onConflictDoUpdate({
      target: websitesTable.externalId,
      set: updateOnConflict,
    });
  }
}

import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionWebsiteVisit from "../../ingestionSchemas/IngestionWebsiteVisit";
import { type NewWebsiteVisit, websitesVisitsTable } from "../../models/WebsiteVisit";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class WebsiteVisitIngester extends Ingester<IngestionWebsiteVisit, NewWebsiteVisit> {
  protected logger = new Logger("WebsiteVisitIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionWebsiteVisit;
  } {
    const websiteVisit = ingestionSchemas.websiteVisit.safeParse(raw);
    return {
      isIngestable: websiteVisit.success,
      parsed: websiteVisit.data,
    };
  }

  transform(raw: IngestionWebsiteVisit): NewWebsiteVisit {
    const transformed: NewWebsiteVisit = {
      externalId: raw.id,

      source: raw.source,
      fileDownloaded: raw.fileDownloaded,
      type: raw.type,
      websiteExternalId: raw.websiteId,
      fromVisitExternalId: raw.fromVisitId,
      importJobId: this.importJobId,
      recordedAt: new Date(raw.recordedAt),
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(websitesVisitsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(websitesVisitsTable).values(this.collected).onConflictDoUpdate({
      target: websitesVisitsTable.externalId,
      set: updateOnConflict,
    });
  }
}

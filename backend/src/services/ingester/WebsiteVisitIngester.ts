import { type SQL, sql } from "drizzle-orm";
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
    // Force all mutable fields to be updated on conflict
    const updateOnConflict: Omit<{ [key in keyof NewWebsiteVisit]: SQL }, "importJobId" | "createdAt"> = {
      externalId: sql`excluded.external_id`,

      source: sql`excluded.source`,
      fileDownloaded: sql`excluded.file_downloaded`,
      type: sql`excluded.type`,
      websiteExternalId: sql`excluded.website_external_id`,
      fromVisitExternalId: sql`excluded.from_visit_external_id`,
      recordedAt: sql`excluded.recorded_at`,
    };

    await this.tx.insert(websitesVisitsTable).values(this.collected).onConflictDoUpdate({
      target: websitesVisitsTable.externalId,
      set: updateOnConflict,
    });
  }
}

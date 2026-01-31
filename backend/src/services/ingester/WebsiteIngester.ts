import { type SQL, sql } from "drizzle-orm";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionWebsite from "../../ingestionSchemas/IngestionWebsite";
import { type NewWebsite, websitesTable } from "../../models/Website";
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
    const transformed: NewWebsite = {
      externalId: raw.id,

      source: raw.source,
      url: raw.url,
      host: raw.host,
      title: raw.title,
      description: raw.description,
      previewImageUrl: raw.previewImageUrl,
      importJobId: this.importJobId,
      recordedAt: raw.recordedAt ? new Date(raw.recordedAt) : null,
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    // Force all mutable fields to be updated on conflict
    const updateOnConflict: Omit<{ [key in keyof NewWebsite]: SQL }, "importJobId" | "createdAt"> = {
      externalId: sql`excluded.external_id`,

      source: sql`excluded.source`,
      url: sql`excluded.url`,
      host: sql`excluded.host`,
      title: sql`excluded.title`,
      description: sql`excluded.description`,
      previewImageUrl: sql`excluded.preview_image_url`,
      recordedAt: sql`excluded.recorded_at`,
    };

    await this.tx.insert(websitesTable).values(this.collected).onConflictDoUpdate({
      target: websitesTable.externalId,
      set: updateOnConflict,
    });
  }
}

import { asc, eq, isNull } from "drizzle-orm";
import { DateTime } from "luxon";
import config from "../../../config";
import { db } from "../../../db/connection";
import type { DBTransaction } from "../../../db/types";
import { websitesVisitsTable } from "../../../models/WebsiteVisit";
import { Logger } from "../../Logger";
import { LocationService } from "../../locations/locations";
import { BaseEnricher } from "../BaseEnricher";

export class TimezoneEnricher extends BaseEnricher {
  protected logger = new Logger("TimezoneEnricher");

  private page = 0;
  private pageSize = 300;
  private maxImportSessionDuration = config.enrichers.timezone.maxImportSessionDuration;

  private currentPage: { id: number; date: Date }[] = [];

  public isEnabled(): boolean {
    return config.enrichers.timezone.enabled;
  }

  // Lots of improvements that can be done here. Most notably we could store the timezones changes in its own
  // table which should make querying way more efficient and would mean that locations become the source of truth
  // for timezone which makes sense
  public async enrich(tx: DBTransaction): Promise<void> {
    const startTime = DateTime.now();
    let lastLogAt = DateTime.now();
    const LOG_EVERY_MS = 5_000;
    let rowsProcessed = 0;
    let lastDate = null;
    while (await this.getPage()) {
      for (const entry of this.currentPage) {
        rowsProcessed++;
        lastDate = entry.date;
        const timezoneResult = await LocationService.getTimezoneForDate(tx, DateTime.fromJSDate(entry.date));
        if (timezoneResult) {
          await tx
            .update(websitesVisitsTable)
            .set({ timezone: timezoneResult.timezone })
            .where(eq(websitesVisitsTable.id, entry.id));
        }
      }
      this.page++;

      const now = DateTime.now();
      if (Math.abs(now.diff(lastLogAt, "milliseconds").milliseconds) >= LOG_EVERY_MS) {
        const elapsedSec = Math.abs(now.diff(startTime, "seconds").seconds);
        const rate = Math.round(rowsProcessed / elapsedSec);

        this.logger.info("Progress", {
          elapsedSec: elapsedSec.toFixed(1),
          linesPerSec: rate,
          lastDate,
        });

        lastLogAt = now;
      }

      // If it has been running for longer than allowed, break out of the loop
      if (Math.abs(startTime.diffNow("seconds").seconds) >= this.maxImportSessionDuration) {
        this.logger.debug("Enricher is running for too long, breaking...");
        break;
      }
    }
  }

  public async getPage() {
    const result = await db
      .select({ id: websitesVisitsTable.id, date: websitesVisitsTable.recordedAt })
      .from(websitesVisitsTable)
      .where(isNull(websitesVisitsTable.timezone))
      .orderBy(asc(websitesVisitsTable.recordedAt))
      .offset(this.page * this.pageSize)
      .limit(this.pageSize);
    this.currentPage = result;
    return result.length > 0;
  }
}

import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../db/connection";
import type { DBTransaction } from "../db/types";
import { importJobsTable } from "../models/ImportJob";
import { Logger } from "../services/Logger";

export class BaseImporter {
  sourceId!: string;
  destinationTable!: string;
  entryDateKey!: string;
  apiVersion?: string;
  placeholderDate = new Date(1997, 6, 6);
  firstEntry: Date | undefined;
  lastEntry: Date | undefined;

  jobStart = DateTime.now();

  logger = new Logger("BaseImporter");

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    throw new Error("sourceHasNewData not implemented");
  }

  public updateFirstAndLastEntry(d: Date | undefined | null) {
    if (!d) {
      return;
    }
    if (!this.firstEntry || d < this.firstEntry) {
      this.firstEntry = d;
    }

    if (!this.lastEntry || d > this.lastEntry) {
      this.lastEntry = d;
    }
  }

  public async startJob() {
    const { result, from } = await this.sourceHasNewData();
    this.logger = new Logger(this.sourceId);
    const timer = this.logger.timer("importer", "info");

    if (!result) {
      this.logger.info("No new data to import");
      return;
    }

    let successfullRollback = false;
    await db
      .transaction(async (tx) => {
        const placeholderJobId = await tx
          .insert(importJobsTable)
          .values({
            source: this.sourceId,
            destinationTable: this.destinationTable,
            entryDateKey: this.entryDateKey,

            jobStart: this.jobStart.toJSDate(),
            jobEnd: this.placeholderDate,
            firstEntryDate: this.placeholderDate,
            lastEntryDate: this.placeholderDate,

            importedCount: 0,
            logs: [],
            createdAt: new Date(),
          })
          .returning({ id: importJobsTable.id })
          .then((r) => r[0]);

        if (!placeholderJobId.id) {
          throw new Error("Failed to insert placeholder job");
        }

        const result = await this.import({
          tx,
          placeholderJobId: placeholderJobId.id,
          from,
        });

        if (result.importedCount === 0) {
          successfullRollback = true;
          this.logger.info("No new data was imported");
          return tx.rollback();
        }

        await tx
          .update(importJobsTable)
          .set({
            jobEnd: new Date(),
            firstEntryDate: result.firstEntryDate ?? this.firstEntry,
            lastEntryDate: result.lastEntryDate ?? this.lastEntry,
            apiCallsCount: result.apiCallsCount,
            apiVersion: this.apiVersion,

            importedCount: result.importedCount,
            logs: result.logs,
            createdAt: new Date(),
          })
          .where(eq(importJobsTable.id, placeholderJobId.id));
        this.logger.info("Finished importing", {
          importJobId: placeholderJobId,
          firstEntryDate: result.firstEntryDate,
          lastEntryDate: result.lastEntryDate,
          apiCallsCount: result.apiCallsCount,
          apiVersion: this.apiVersion,
          importedCount: result.importedCount,
        });
      })
      .catch((e) => {
        if (!successfullRollback) {
          timer.endWithError(e);
        }
      });
    timer.end();
  }

  public async import(_params: { tx: DBTransaction; placeholderJobId: number; from?: DateTime }): Promise<{
    importedCount: number;
    firstEntryDate?: Date;
    lastEntryDate?: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    throw new Error("Import not implemented");
  }
}

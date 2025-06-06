import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc, sql } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { sleepRecordsTable } from "../../../models/SleepRecord";
import { snoringRecordsTable, type NewSnoringRecord } from "../../../models";
import { SamsungHealthSnoringCsvRowSchema } from "./schema";
import type { z } from "zod";

export class SamsungHealthSnoringImporter extends BaseSamsungHealthImporter<NewSnoringRecord> {
  override sourceId = "samsung-health-export-snoring-v1";
  override destinationTable = "snoring_records";
  override entryDateKey = "start_time";

  private fromDate: DateTime | null = null;

  constructor() {
    const identifier = "com.samsung.shealth.sleep_snoring";

    super({
      recordsTable: snoringRecordsTable,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (_row: unknown, _data: unknown, _importJobId: number) => {
        throw new Error("Sleep data should not be binned");
      },
      onNewRow: async (data: unknown, importJobId: number) => {
        const csvRow = SamsungHealthSnoringCsvRowSchema.parse(data);

        const validated = this.validateEntry(csvRow);
        if (validated.skip) {
          return null;
        }

        const { startTime, endTime, timeOffset, dataUuid } = validated;

        const sleepRecord = await db.query.sleepRecordsTable.findFirst({
          where: sql`${sleepRecordsTable.bedTime} <= ${startTime.toISO()} AND ${
            sleepRecordsTable.awakeTime
          } >= ${endTime.toISO()}`,
        });

        if (!sleepRecord) {
          this.logger.error("Sleep record not found for snoring record", {
            ...csvRow,
          });
          return null;
        }

        const dbEntry: NewSnoringRecord = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          sleepRecordId: sleepRecord.id,
          timezone: offsetToTimezone(timeOffset),

          dataExportId: dataUuid,
          importJobId,
        };

        this.updateFirstAndLastEntry(dbEntry.startTime);
        this.updateFirstAndLastEntry(dbEntry.endTime);

        return dbEntry;
      },
    });
  }

  private validateEntry(
    csvRow: z.infer<typeof SamsungHealthSnoringCsvRowSchema>,
  ): { skip: true } | { skip: false; startTime: DateTime; endTime: DateTime; timeOffset: string; dataUuid: string } {
    const dateFormat = "yyyy-MM-dd HH:mm:ss.SSS";
    if (!csvRow.startTime) {
      this.logger.error("Snoring entry without start time. Skipping it");
      return { skip: true };
    }
    if (!csvRow.endTime) {
      this.logger.error("Snoring entry without end time. Skipping it");
      return { skip: true };
    }
    if (!csvRow.timeOffset) {
      this.logger.error("Snoring entry without timeOffset. Skipping it");
      return { skip: true };
    }
    if (!csvRow.dataUuid) {
      this.logger.error("Snoring entry without dataUuid. Skipping it");
      return { skip: true };
    }

    const startTime = DateTime.fromFormat(csvRow.startTime, dateFormat, {
      zone: "UTC",
    });
    const endTime = DateTime.fromFormat(csvRow.endTime, dateFormat, {
      zone: "UTC",
    });

    if (!startTime.isValid) {
      throw new Error("Missing start time");
    }
    if (!endTime.isValid) {
      throw new Error("Missing end time");
    }

    if (this.fromDate && startTime.diff(this.fromDate, "milliseconds").milliseconds <= 0) {
      return { skip: true };
    }

    return { skip: false, startTime, endTime, timeOffset: csvRow.timeOffset, dataUuid: csvRow.dataUuid };
  }

  override async import(params: {
    tx: DBTransaction;
    placeholderJobId: number;
  }): Promise<{
    importedCount: number;
    firstEntryDate?: Date;
    lastEntryDate?: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    const fromDate = await db.query.snoringRecordsTable.findFirst({
      orderBy: desc(snoringRecordsTable.startTime),
    });

    this.fromDate = fromDate ? DateTime.fromJSDate(fromDate.startTime, { zone: "UTC" }) : null;

    return super.import(params);
  }
}

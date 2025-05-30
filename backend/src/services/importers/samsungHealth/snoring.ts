import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc, sql } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { sleepRecordsTable } from "../../../models/SleepRecord";
import { snoringRecordsTable, type NewSnoringRecord } from "../../../models";

export class SamsungHealthSnoringImporter extends BaseSamsungHealthImporter<NewSnoringRecord> {
  override sourceId = "samsung-health-export-snoring-v1";
  override destinationTable = "snoring_records";
  override entryDateKey = "start_time";

  private fromDate: DateTime | null = null;

  constructor() {
    const identifier = "com.samsung.shealth.sleep_snoring";
    const headersMap = {
      dataUuid: "datauuid",
      startTime: "start_time",
      endTime: "end_time",
      timeOffset: "time_offset",
    };

    super({
      recordsTable: snoringRecordsTable,
      headersMap,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (row: any, data: any, importJobId: number) => {
        throw new Error("Sleep data should not be binned");
      },
      onNewRow: async (data: any, importJobId: number) => {
        if (!data[headersMap.startTime]) {
          throw new Error("Missing start time");
        }
        if (!data[headersMap.endTime]) {
          throw new Error("Missing end time");
        }
        if (!data[headersMap.timeOffset]) {
          throw new Error("Missing time offset");
        }
        if (!data[headersMap.dataUuid]) {
          throw new Error("Missing data uuid");
        }
        const dateFormat = "yyyy-MM-dd HH:mm:ss.SSS";
        const startTime = DateTime.fromFormat(data[headersMap.startTime], dateFormat, {
          zone: "UTC",
        });

        // Already imported
        if (this.fromDate && startTime.diff(this.fromDate, "milliseconds").milliseconds <= 0) {
          return null;
        }

        const endTime = DateTime.fromFormat(data[headersMap.endTime], dateFormat, {
          zone: "UTC",
        });

        const sleepRecord = await db.query.sleepRecordsTable.findFirst({
          where: sql`${sleepRecordsTable.bedTime} <= ${startTime.toISO()} AND ${
            sleepRecordsTable.awakeTime
          } >= ${endTime.toISO()}`,
        });

        if (!sleepRecord) {
          this.logs.push(`Sleep record not found for snoring record ${data[headersMap.dataUuid]}`);
          return null;
        }

        const dbEntry: NewSnoringRecord = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          sleepRecordId: sleepRecord.id,
          timezone: offsetToTimezone(data[headersMap.timeOffset]),

          dataExportId: data[headersMap.dataUuid],
          importJobId,
        };

        this.updateFirstAndLastEntry(dbEntry.startTime);
        this.updateFirstAndLastEntry(dbEntry.endTime);

        return dbEntry;
      },
    });
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

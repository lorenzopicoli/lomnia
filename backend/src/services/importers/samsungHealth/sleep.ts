import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { sleepRecordsTable, type NewSleepRecord } from "../../../models/SleepRecord";
import { isNumber } from "../../../helpers/isNumber";
import { SamsungHealthSleepCsvSchema } from "./schema";
import config from "../../../config";

export class SamsungHealthSleepImporter extends BaseSamsungHealthImporter<NewSleepRecord> {
  override sourceId = "samsung-health-export-sleep-v1";
  override destinationTable = "sleep_records";
  override entryDateKey = "com.samsung.health.sleep.start_time";

  private fromDate: DateTime | null = null;

  constructor() {
    const identifier = "com.samsung.shealth.sleep";

    super({
      recordsTable: sleepRecordsTable,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (row: unknown, data: unknown, importJobId: number) => {
        throw new Error("Sleep data should not be binned");
      },
      onNewRow: async (data: unknown, importJobId: number) => {
        const csvRow = SamsungHealthSleepCsvSchema.parse(data);

        const dateFormat = "yyyy-MM-dd HH:mm:ss.SSS";
        const startTime = DateTime.fromFormat(csvRow.startTime, dateFormat, {
          zone: "UTC",
        });
        const endTime = DateTime.fromFormat(csvRow.endTime, dateFormat, {
          zone: "UTC",
        });

        const { skip } = this.validateEntry({ startTime, endTime, timeOffset: csvRow.timeOffset });
        if (skip) {
          return null;
        }

        const dbEntry: NewSleepRecord = {
          isSleepTimeManual: csvRow.deviceUuid === config.importers.health.samsung.sleep.manualSleepDeviceUuid,
          source: "samsung_health",
          sleepScoreManual: null,

          bedTime: startTime.toJSDate(),
          awakeTime: endTime.toJSDate(),
          timezone: offsetToTimezone(csvRow.timeOffset),
          sleepScoreExternal: this.ensureNumber(csvRow.sleepScore),
          mentalRecovery: this.ensureNumber(csvRow.mentalRecovery),
          physicalRecovery: this.ensureNumber(csvRow.physicalRecovery),
          sleepCycles: this.ensureNumber(csvRow.sleepCycles),
          efficiency: this.ensureNumber(csvRow.efficiency),
          comment: csvRow.comment,
          samsungSleepId: csvRow.dataUuid,

          dataExportId: csvRow.dataUuid,
          importJobId,
        };

        this.updateFirstAndLastEntry(dbEntry.bedTime);
        this.updateFirstAndLastEntry(dbEntry.awakeTime);

        return dbEntry;
      },
    });
  }

  private ensureNumber(possibleNumber?: string | number): number | null {
    return possibleNumber && isNumber(+possibleNumber) ? +possibleNumber : null;
  }

  private validateEntry(params: { startTime: DateTime; endTime: DateTime; timeOffset: string }): { skip: boolean } {
    const { startTime, endTime, timeOffset } = params;
    if (!startTime.isValid) {
      throw new Error("Missing start time");
    }
    if (!endTime.isValid) {
      throw new Error("Missing end time");
    }

    if (this.fromDate && startTime.diff(this.fromDate, "milliseconds").milliseconds <= 0) {
      return { skip: true };
    }

    return { skip: false };
  }

  override async import(params: { tx: DBTransaction; placeholderJobId: number }): Promise<{
    importedCount: number;
    firstEntryDate?: Date;
    lastEntryDate?: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    const fromDate = await db.query.sleepRecordsTable.findFirst({
      orderBy: desc(sleepRecordsTable.bedTime),
    });

    this.fromDate = fromDate ? DateTime.fromJSDate(fromDate.bedTime, { zone: "UTC" }) : null;

    return super.import(params);
  }
}

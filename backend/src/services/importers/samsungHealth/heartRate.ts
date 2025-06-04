import { heartRateTable, type NewHeartRate } from "../../../models/HeartRate";
import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { SamsungHeartRateBinnedDataSchema, SamsungHeartRateCsvRowSchema } from "./schema";

export class SamsungHealthHeartRateImporter extends BaseSamsungHealthImporter<NewHeartRate> {
  override sourceId = "samsung-health-export-hr-v1";
  override destinationTable = "heart_rate_readings";
  override entryDateKey = "com.samsung.health.heart_rate.start_time";

  private fromDate: DateTime | null = null;

  // Due to what I can only assume is a bug in samsungs parts, I get these wrong timezones. I just throw away these entries
  private invalidTimezones = [
    "UTC+28550",
    "UTC+28134",
    "UTC+27718",
    "UTC+28134",
    "UTC+29006",
    "UTC+30254",
    "UTC+28550",
  ];

  constructor() {
    const identifier = "com.samsung.shealth.tracker.heart_rate";

    super({
      recordsTable: heartRateTable,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (csvRowParam: unknown, binnedDataParam: unknown, importJobId: number) => {
        const csvRow = SamsungHeartRateCsvRowSchema.parse(csvRowParam);
        const binnedData = SamsungHeartRateBinnedDataSchema.parse(binnedDataParam);
        const startTime = DateTime.fromMillis(binnedData.startTime);
        const endTime = DateTime.fromMillis(binnedData.endTime);

        const { skip } = this.validateEntry({ startTime, endTime, timeOffset: csvRow.timeOffset });

        if (skip) {
          return null;
        }

        const tz = offsetToTimezone(csvRow.timeOffset);

        const data = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          heartRate: binnedData.heartRate,
          heartRateMax: binnedData.heartRateMax,
          heartRateMin: binnedData.heartRateMin,
          timezone: tz,
          comment: csvRow.comment,
          binUuid: csvRow.dataUuid,
          dataExportId: csvRow.dataUuid,
          importJobId,
        };

        this.updateFirstAndLastEntry(data.startTime);
        this.updateFirstAndLastEntry(data.endTime);

        return data;
      },
      onNewRow: async (rowParam: unknown, importJobId: number) => {
        const csvRow = SamsungHeartRateCsvRowSchema.parse(rowParam);
        const startTime = DateTime.fromSQL(csvRow.startTime);
        const endTime = DateTime.fromSQL(csvRow.endTime);
        const { skip } = this.validateEntry({ startTime, endTime, timeOffset: csvRow.timeOffset });

        if (skip) {
          return null;
        }
        const tz = offsetToTimezone(csvRow.timeOffset);
        const data = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          heartRate: csvRow.heartRate,
          heartRateMax: csvRow.heartRateMax,
          heartRateMin: csvRow.heartRateMin,
          timezone: tz,
          comment: csvRow.comment,
          binUuid: csvRow.dataUuid,
          dataExportId: csvRow.dataUuid,
          importJobId,
        };

        this.updateFirstAndLastEntry(data.startTime);
        this.updateFirstAndLastEntry(data.endTime);

        return data;
      },
    });
  }

  private validateEntry(params: { startTime: DateTime; endTime: DateTime; timeOffset: string }): { skip: boolean } {
    const { startTime, endTime, timeOffset } = params;
    if (!startTime.isValid) {
      throw new Error("Invalid start time found in health heart rate importer");
    }

    // Due to what I can only assume to be Samsungs bug, some entries are 100 years in the future
    if (startTime.diff(DateTime.now(), "years").years > 1) {
      return { skip: true };
    }

    if (!endTime.isValid) {
      throw new Error("Invalid end time found in health heart rate importer");
    }

    if (this.invalidTimezones.includes(timeOffset)) {
      return { skip: true };
    }

    // Already imported
    if (this.fromDate && startTime.diff(this.fromDate, "millisecond").milliseconds <= 0) {
      return { skip: true };
    }

    return { skip: false };
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
    const fromDate = await db.query.heartRateTable.findFirst({
      orderBy: desc(heartRateTable.startTime),
    });

    this.fromDate = fromDate ? DateTime.fromJSDate(fromDate.startTime, { zone: "UTC" }) : null;

    return super.import(params);
  }
}

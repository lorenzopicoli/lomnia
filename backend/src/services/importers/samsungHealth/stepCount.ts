import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { stepCountTable, type NewStepCount } from "../../../models/StepCount";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { SamsungHealthStepCountCsvRowSchema } from "./schema";

export class SamsungHealthStepCountImporter extends BaseSamsungHealthImporter<NewStepCount> {
  override sourceId = "samsung-health-export-sc-v1";
  override destinationTable = "step_counts";
  override entryDateKey = "com.samsung.health.step_count.create_time";

  private fromDate: DateTime | null = null;

  constructor() {
    const identifier = "com.samsung.shealth.tracker.pedometer_step_count";
    const csvColumnPrefix = "com.samsung.health.step_count";

    super({
      recordsTable: stepCountTable,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (_row: unknown, _data: unknown, _importJobId: number) => {
        throw new Error("Step count data should not be binned");
      },
      onNewRow: async (data: unknown, importJobId: number) => {
        const csvRow = SamsungHealthStepCountCsvRowSchema.parse(data);
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

        const dbEntry: NewStepCount = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          walkStep: csvRow.walkStep,
          runStep: csvRow.runStep,
          stepCount: csvRow.stepCount,
          speed: csvRow.speed,
          distance: csvRow.distance,
          calories: csvRow.calories,
          timezone: offsetToTimezone(csvRow.timeOffset),
          dataExportId: csvRow.dataUuid,
          importJobId,
        };

        this.updateFirstAndLastEntry(dbEntry.startTime);
        this.updateFirstAndLastEntry(dbEntry.endTime);
        return dbEntry;
      },
    });
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
    const fromDate = await db.query.stepCountTable.findFirst({
      orderBy: desc(stepCountTable.startTime),
    });

    this.fromDate = fromDate ? DateTime.fromJSDate(fromDate.startTime, { zone: "UTC" }) : null;

    return super.import(params);
  }
}

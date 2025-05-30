import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { stepCountTable, type NewStepCount } from "../../../models/StepCount";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { isNumber } from "../../../helpers/isNumber";
import { db } from "../../../db/connection";
import { desc } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";

export class SamsungHealthStepCountImporter extends BaseSamsungHealthImporter<NewStepCount> {
  override sourceId = "samsung-health-export-sc-v1";
  override destinationTable = "step_counts";
  override entryDateKey = "com.samsung.health.step_count.create_time";

  private fromDate: DateTime | null = null;

  constructor() {
    const identifier = "com.samsung.shealth.tracker.pedometer_step_count";
    const csvColumnPrefix = "com.samsung.health.step_count";
    const headersMap = {
      runStep: "run_step",
      walkStep: "walk_step",
      startTime: `${csvColumnPrefix}.start_time`,
      endTime: `${csvColumnPrefix}.end_time`,
      stepCount: `${csvColumnPrefix}.count`,
      speed: `${csvColumnPrefix}.speed`,
      distance: `${csvColumnPrefix}.distance`,
      calories: `${csvColumnPrefix}.calorie`,
      timeOffset: `${csvColumnPrefix}.time_offset`,
      deviceUuid: `${csvColumnPrefix}.deviceuuid`,
      dataUuid: `${csvColumnPrefix}.datauuid`,
    };

    super({
      recordsTable: stepCountTable,
      headersMap,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (row: any, data: any, importJobId: number) => {
        throw new Error("Step count data should not be binned");
      },
      onNewRow: async (data: any, importJobId: number) => {
        if (!data[headersMap.startTime]) {
          throw new Error("Missing start time");
        }
        if (!data[headersMap.endTime]) {
          throw new Error("Missing end time");
        }
        if (!isNumber(data[headersMap.walkStep])) {
          throw new Error("Missing walk step");
        }
        if (!isNumber(data[headersMap.runStep])) {
          throw new Error("Missing run step");
        }
        if (!isNumber(data[headersMap.stepCount])) {
          throw new Error("Missing step count");
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

        const dbEntry: NewStepCount = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          walkStep: data[headersMap.walkStep],
          runStep: data[headersMap.runStep],
          stepCount: data[headersMap.stepCount],
          speed: data[headersMap.speed],
          distance: data[headersMap.distance],
          calories: data[headersMap.calories],
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
    const fromDate = await db.query.stepCountTable.findFirst({
      orderBy: desc(stepCountTable.startTime),
    });

    this.fromDate = fromDate ? DateTime.fromJSDate(fromDate.startTime, { zone: "UTC" }) : null;

    return super.import(params);
  }
}

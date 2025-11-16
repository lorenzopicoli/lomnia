import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc, eq } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { sleepRecordsTable } from "../../../models/SleepRecord";
import { sleepStagesTable, type NewSleepStage } from "../../../models";
import { SamsungHealthSleepStageCsvRowSchema } from "./schema";
import type z from "zod";
import config from "../../../config";

export class SamsungHealthSleepStageImporter extends BaseSamsungHealthImporter<NewSleepStage> {
  override sourceId = "samsung-health-export-sleepStage-v1";
  override destinationTable = "sleep_stages";
  override entryDateKey = "start_time";

  private fromDate: DateTime | null = null;

  constructor() {
    const identifier = "com.samsung.health.sleep_stage";

    super({
      recordsTable: sleepStagesTable,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (_row: unknown, data: unknown, _importJobId: number) => {
        throw new Error("Sleep data should not be binned");
      },
      onNewRow: async (data: unknown, importJobId: number) => {
        const csvRow = SamsungHealthSleepStageCsvRowSchema.parse(data);

        const validated = this.validateEntry(csvRow);
        if (validated.skip) {
          return null;
        }

        const { startTime, endTime, sleepId, timeOffset, dataUuid, sleepStage } = validated;

        const sleepRecord = await db.query.sleepRecordsTable.findFirst({
          where: eq(sleepRecordsTable.samsungSleepId, sleepId),
        });

        if (!sleepRecord) {
          this.logger.error("Sleep record not found for sleep stage record", {
            s: csvRow.sleepId,
          });
          return null;
        }

        const stage = this.stageToStageEnum(sleepStage);

        const dbEntry: NewSleepStage = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          stage,
          sleepRecordId: sleepRecord.id,
          samsungSleepId: csvRow.sleepId,
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

  private stageToStageEnum(rawStage: number) {
    if (rawStage === 40001) {
      return "awake";
    }
    if (rawStage === 40002) {
      return "light";
    }
    if (rawStage === 40003) {
      return "deep";
    }
    if (rawStage === 40004) {
      return "rem";
    }
    throw new Error(`Invalid stage ${rawStage}`);
  }

  private validateEntry(csvRow: z.infer<typeof SamsungHealthSleepStageCsvRowSchema>):
    | { skip: true }
    | {
        skip: false;
        startTime: DateTime;
        endTime: DateTime;
        timeOffset: string;
        dataUuid: string;
        sleepId: string;
        sleepStage: number;
      } {
    const dateFormat = "yyyy-MM-dd HH:mm:ss.SSS";

    if (csvRow.sleepId && config.importers.health.samsung.sleepStage.skipSleepIds.indexOf(csvRow.sleepId) > -1) {
      return { skip: true };
    }

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
    if (!csvRow.sleepId) {
      this.logger.error("Snoring entry without dataUuid. Skipping it");
      return { skip: true };
    }
    if (!csvRow.stage) {
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

    // Already imported
    if (this.fromDate && startTime.diff(this.fromDate, "milliseconds").milliseconds <= 0) {
      return { skip: true };
    }

    return {
      skip: false,
      startTime,
      endTime,
      timeOffset: csvRow.timeOffset,
      dataUuid: csvRow.dataUuid,
      sleepId: csvRow.sleepId,
      sleepStage: csvRow.stage,
    };
  }

  override async import(params: { tx: DBTransaction; placeholderJobId: number }): Promise<{
    importedCount: number;
    firstEntryDate?: Date;
    lastEntryDate?: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    const fromDate = await db.query.sleepStagesTable.findFirst({
      orderBy: desc(sleepStagesTable.startTime),
    });

    this.fromDate = fromDate ? DateTime.fromJSDate(fromDate.startTime, { zone: "UTC" }) : null;

    return super.import(params);
  }
}

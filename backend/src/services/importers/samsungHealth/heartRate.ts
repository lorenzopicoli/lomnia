import { heartRateTable, type NewHeartRate } from "../../../models/HeartRate";
import { DateTime } from "luxon";
import { BaseSamsungHealthImporter } from ".";
import { offsetToTimezone } from "../../../helpers/offsetToTimezone";
import { db } from "../../../db/connection";
import { desc } from "drizzle-orm";
import type { DBTransaction } from "../../../db/types";
import { z } from "zod";
import { camelize } from "../../../helpers/camelize";

const CsvRowSchema = z
  .object({
    source: z.string().optional(),
    tag_id: z.number().optional(),
    "com.samsung.health.heart_rate.create_sh_ver": z.number().optional(),
    "com.samsung.health.heart_rate.heart_beat_count": z.number().optional(),
    "com.samsung.health.heart_rate.start_time": z.string(),
    "com.samsung.health.heart_rate.custom": z.string().optional(),
    "com.samsung.health.heart_rate.binning_data": z.string().optional(),
    "com.samsung.health.heart_rate.modify_sh_ver": z.string().or(z.number()).optional(),
    "com.samsung.health.heart_rate.update_time": z.string().optional(),
    "com.samsung.health.heart_rate.create_time": z.string().optional(),
    "com.samsung.health.heart_rate.max": z.coerce.number(),
    "com.samsung.health.heart_rate.min": z.coerce.number(),
    /**
     * offset in string format UTC-0400
     */
    "com.samsung.health.heart_rate.time_offset": z.string(),
    "com.samsung.health.heart_rate.deviceuuid": z.string().optional(),
    "com.samsung.health.heart_rate.comment": z.string().optional(),
    "com.samsung.health.heart_rate.pkg_name": z.string().optional(),
    "com.samsung.health.heart_rate.end_time": z.string(),
    "com.samsung.health.heart_rate.datauuid": z.string(),
    "com.samsung.health.heart_rate.heart_rate": z.coerce.number(),
  })
  .transform((raw) => {
    const csvColumnPrefix = "com.samsung.health.heart_rate";

    return {
      source: raw.source,
      tagId: raw.tag_id,
      deviceUuid: raw[`${csvColumnPrefix}.deviceuuid`],
      packageName: raw[`${csvColumnPrefix}.pkg_name`],
      dataUuid: raw[`${csvColumnPrefix}.datauuid`],

      startTime: raw[`${csvColumnPrefix}.start_time`],
      endTime: raw[`${csvColumnPrefix}.end_time`],
      createTime: raw[`${csvColumnPrefix}.create_time`],
      updateTime: raw[`${csvColumnPrefix}.update_time`],
      timeOffset: raw[`${csvColumnPrefix}.time_offset`],

      heartRate: raw[`${csvColumnPrefix}.heart_rate`],
      heartRateMax: raw[`${csvColumnPrefix}.max`],
      heartRateMin: raw[`${csvColumnPrefix}.min`],
      heartBeatCount: raw[`${csvColumnPrefix}.heart_beat_count`],

      binningData: raw[`${csvColumnPrefix}.binning_data`],
      comment: raw[`${csvColumnPrefix}.comment`],
      custom: raw[`${csvColumnPrefix}.custom`],

      createShVersion: raw[`${csvColumnPrefix}.create_sh_ver`],
      modifyShVersion: raw[`${csvColumnPrefix}.modify_sh_ver`],
    };
  });

const BinnedDataSchema = z
  .object({
    start_time: z.number(), // Unix timestamp in milliseconds
    end_time: z.number(), // Unix timestamp in milliseconds
    heart_rate: z.number(),
    heart_rate_max: z.number(),
    heart_rate_min: z.number(),
  })
  .transform(camelize);

// type SamsungHealthHeartRateCsvRow = z.infer<typeof CsvRowSchema>;
// type SamsungHealthHeartRateBinnedData = z.infer<typeof BinnedDataSchema>;

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
        const csvRow = CsvRowSchema.parse(csvRowParam);
        const binnedData = BinnedDataSchema.parse(binnedDataParam);
        const startTime = DateTime.fromMillis(binnedData.startTime);
        const endTime = DateTime.fromMillis(binnedData.endTime);
        if (!endTime.isValid || !startTime.isValid) {
          this.logger.error("Invalid start or end time found in health heart rate importer", {
            binnedData,
          });
        }
        // Already imported
        if (this.fromDate && startTime.diff(this.fromDate, "millisecond").milliseconds <= 0) {
          return null;
        }

        if (this.invalidTimezones.includes(csvRow.timeOffset)) {
          return null;
        }

        // Due to what I can only assume to be Samsungs bug, some entries are 100 years in the future
        if (startTime.diff(DateTime.now(), "years").years > 1) {
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
        const csvRow = CsvRowSchema.parse(rowParam);
        const startTime = DateTime.fromSQL(csvRow.startTime);
        const endTime = DateTime.fromSQL(csvRow.endTime);
        if (!endTime.isValid || !startTime.isValid) {
          this.logger.error("Invalid start or end time found in health heart rate importer", {
            csvRow,
          });
        }
        // Already imported
        if (this.fromDate && startTime.diff(this.fromDate, "millisecond").milliseconds <= 0) {
          return null;
        }
        if (this.invalidTimezones.includes(csvRow.timeOffset)) {
          return null;
        }

        // Due to what I can only assume to be Samsungs bug, some entries are 100 years in the future
        if (startTime.diff(DateTime.now(), "years").years > 1) {
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

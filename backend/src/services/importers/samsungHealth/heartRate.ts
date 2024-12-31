import { heartRateTable, type NewHeartRate } from '../../../models/HeartRate'
import { DateTime } from 'luxon'
import { BaseSamsungHealthImporter } from '.'
import { offsetToTimezone } from '../../../helpers/offsetToTimezone'
import { db } from '../../../db/connection'
import { desc } from 'drizzle-orm'
import type { DBTransaction } from '../../../db/types'

export class SamsungHealthHeartRateImporter extends BaseSamsungHealthImporter<NewHeartRate> {
  override sourceId = 'samsung-health-export-hr-v1'
  override destinationTable = 'heart_rate_readings'
  override entryDateKey = 'com.samsung.health.heart_rate.start_time'

  private fromDate: DateTime | null = null

  // Due to what I can only assume is a bug in samsungs parts, I get these wrong timezones. I just throw away these entries
  private invalidTimezones = [
    'UTC+28550',
    'UTC+28134',
    'UTC+27718',
    'UTC+28134',
    'UTC+29006',
    'UTC+30254',
    'UTC+28550',
  ]

  constructor() {
    const identifier = 'com.samsung.shealth.tracker.heart_rate'
    const csvColumnPrefix = 'com.samsung.health.heart_rate'

    const headersMap = {
      source: 'source',
      tagId: 'tag_id',
      createShVer: `${csvColumnPrefix}.create_sh_ver`,
      heartBeatCount: `${csvColumnPrefix}.heart_beat_count`,
      startTime: `${csvColumnPrefix}.start_time`,
      custom: `${csvColumnPrefix}.custom`,
      binningData: `${csvColumnPrefix}.binning_data`,
      modifyShVer: `${csvColumnPrefix}.modify_sh_ver`,
      updateTime: `${csvColumnPrefix}.update_time`,
      createTime: `${csvColumnPrefix}.create_time`,
      max: `${csvColumnPrefix}.max`,
      min: `${csvColumnPrefix}.min`,
      timeOffset: `${csvColumnPrefix}.time_offset`,
      deviceUuid: `${csvColumnPrefix}.deviceuuid`,
      comment: `${csvColumnPrefix}.comment`,
      packageName: `${csvColumnPrefix}.pkg_name`,
      endTime: `${csvColumnPrefix}.end_time`,
      dataUuid: `${csvColumnPrefix}.datauuid`,
      heartRate: `${csvColumnPrefix}.heart_rate`,
    }

    super({
      recordsTable: heartRateTable,
      headersMap,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (
        csvRow: any,
        binnedData: any,
        importJobId: number
      ) => {
        const startTime = DateTime.fromMillis(binnedData.start_time)
        // Already imported
        if (this.fromDate && startTime.diff(this.fromDate).milliseconds <= 0) {
          return null
        }

        if (this.invalidTimezones.includes(csvRow[headersMap.timeOffset])) {
          return null
        }

        // Due to what I can only assume to be Samsungs bug, some entries are 100 years in the future
        if (startTime.diff(DateTime.now()).years > 1) {
          return null
        }

        const tz = offsetToTimezone(csvRow[headersMap.timeOffset])

        return {
          startTime: startTime.toJSDate(),
          endTime: DateTime.fromMillis(binnedData.end_time).toJSDate(),
          heartRate: binnedData.heart_rate,
          heartRateMax: binnedData.heart_rate_max,
          heartRateMin: binnedData.heart_rate_min,
          timezone: tz,
          comment: csvRow[headersMap.comment],
          binUuid: csvRow[headersMap.dataUuid],
          dataExportId: csvRow[headersMap.dataUuid],
          importJobId,
        }
      },
      onNewRow: async (row: any, importJobId: number) => {
        const startTime = DateTime.fromSQL(row[headersMap.startTime])
        // Already imported
        if (this.fromDate && startTime.diff(this.fromDate).milliseconds <= 0) {
          return null
        }
        if (this.invalidTimezones.includes(row[headersMap.timeOffset])) {
          return null
        }
        // Due to what I can only assume to be Samsungs bug, some entries are 100 years in the future
        if (startTime.diff(DateTime.now()).years > 1) {
          return null
        }

        const tz = offsetToTimezone(row[headersMap.timeOffset])
        return {
          startTime: startTime.toJSDate(),
          endTime: DateTime.fromSQL(row[headersMap.endTime]).toJSDate(),
          heartRate: row[headersMap.heartRate],
          heartRateMax: row[headersMap.max],
          heartRateMin: row[headersMap.min],
          timezone: tz,
          comment: row[headersMap.comment],
          binUuid: row[headersMap.dataUuid],
          dataExportId: row[headersMap.dataUuid],
          importJobId,
        }
      },
    })
  }

  override async import(params: {
    tx: DBTransaction
    placeholderJobId: number
  }): Promise<{
    importedCount: number
    firstEntryDate?: Date
    lastEntryDate?: Date
    apiCallsCount?: number
    logs: string[]
  }> {
    const fromDate = await db.query.heartRateTable.findFirst({
      orderBy: desc(heartRateTable.startTime),
    })

    this.fromDate = fromDate
      ? DateTime.fromJSDate(fromDate.startTime, { zone: 'UTC' })
      : null

    return super.import(params)
  }
}

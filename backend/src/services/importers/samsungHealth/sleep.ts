import { DateTime } from 'luxon'
import { BaseSamsungHealthImporter } from '.'
import { offsetToTimezone } from '../../../helpers/offsetToTimezone'
import { db } from '../../../db/connection'
import { desc } from 'drizzle-orm'
import type { DBTransaction } from '../../../db/types'
import {
  sleepRecordsTable,
  type NewSleepRecord,
} from '../../../models/SleepRecord'
import { isNumber } from '../../../helpers/isNumber'

export class SamsungHealthSleepImporter extends BaseSamsungHealthImporter<NewSleepRecord> {
  override sourceId = 'samsung-health-export-sleep-v1'
  override destinationTable = 'sleep_records'
  override entryDateKey = 'com.samsung.health.sleep.start_time'

  private fromDate: DateTime | null = null

  constructor() {
    const identifier = 'com.samsung.shealth.sleep'
    const csvColumnPrefix = 'com.samsung.health.sleep'
    const headersMap = {
      mentalRecovery: `mental_recovery`,
      physicalRecovery: `physical_recovery`,
      efficiency: `efficiency`,
      sleepScore: `sleep_score`,
      sleepCycles: `sleep_cycles`,
      startTime: `${csvColumnPrefix}.start_time`,
      endTime: `${csvColumnPrefix}.end_time`,
      timeOffset: `${csvColumnPrefix}.time_offset`,
      comment: `${csvColumnPrefix}.comment`,
      dataUuid: `${csvColumnPrefix}.datauuid`,
      deviceUuid: `${csvColumnPrefix}.deviceuuid`,
    }

    super({
      recordsTable: sleepRecordsTable,
      headersMap,
      identifier,
      binnedDataColumn: undefined,
      onNewBinnedData: async (row: any, data: any, importJobId: number) => {
        throw new Error('Sleep data should not be binned')
      },
      onNewRow: async (data: any, importJobId: number) => {
        if (!data[headersMap.startTime]) {
          throw new Error('Missing start time')
        }
        if (!data[headersMap.endTime]) {
          throw new Error('Missing end time')
        }
        if (!data[headersMap.timeOffset]) {
          throw new Error('Missing time offset')
        }
        if (!data[headersMap.dataUuid]) {
          throw new Error('Missing data uuid')
        }
        const dateFormat = 'yyyy-MM-dd HH:mm:ss.SSS'
        const startTime = DateTime.fromFormat(
          data[headersMap.startTime],
          dateFormat,
          {
            zone: 'UTC',
          }
        )

        // Already imported
        if (this.fromDate && startTime.diff(this.fromDate).milliseconds <= 0) {
          return null
        }

        const endTime = DateTime.fromFormat(
          data[headersMap.endTime],
          dateFormat,
          {
            zone: 'UTC',
          }
        )

        const dbEntry: NewSleepRecord = {
          isSleepTimeManual: data[headersMap.deviceUuid] === 'YONCTMRFDw',
          sleepScoreManual: null,

          bedTime: startTime.toJSDate(),
          awakeTime: endTime.toJSDate(),
          timezone: offsetToTimezone(data[headersMap.timeOffset]),
          source: 'samsung_health',
          sleepScoreExternal: isNumber(+data[headersMap.sleepScore])
            ? +data[headersMap.sleepScore]
            : null,
          mentalRecovery: isNumber(+data[headersMap.mentalRecovery])
            ? +data[headersMap.mentalRecovery]
            : null,
          physicalRecovery: isNumber(+data[headersMap.physicalRecovery])
            ? +data[headersMap.physicalRecovery]
            : null,
          sleepCycles: isNumber(+data[headersMap.sleepCycles])
            ? +data[headersMap.sleepCycles]
            : null,
          efficiency: isNumber(+data[headersMap.efficiency])
            ? +data[headersMap.efficiency]
            : null,
          comment: data[headersMap.comment],
          samsungSleepId: data[headersMap.dataUuid],

          dataExportId: data[headersMap.dataUuid],
          importJobId,
        }

        return dbEntry
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
    const fromDate = await db.query.sleepRecordsTable.findFirst({
      orderBy: desc(sleepRecordsTable.bedTime),
    })

    this.fromDate = fromDate
      ? DateTime.fromJSDate(fromDate.bedTime, { zone: 'UTC' })
      : null

    return super.import(params)
  }
}

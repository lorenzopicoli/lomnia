import { DateTime } from 'luxon'
import { BaseSamsungHealthImporter } from '.'
import { offsetToTimezone } from '../../../helpers/offsetToTimezone'
import { db } from '../../../db/connection'
import { desc, eq } from 'drizzle-orm'
import type { DBTransaction } from '../../../db/types'
import { sleepRecordsTable } from '../../../models/SleepRecord'
import { sleepStagesTable, type NewSleepStage } from '../../../models'

export class SamsungHealthSleepStageImporter extends BaseSamsungHealthImporter<NewSleepStage> {
  override sourceId = 'samsung-health-export-sleepStage-v1'
  override destinationTable = 'sleep_stages'
  override entryDateKey = 'start_time'

  private fromDate: DateTime | null = null

  constructor() {
    const identifier = 'com.samsung.health.sleep_stage'
    const headersMap = {
      dataUuid: 'datauuid',
      startTime: 'start_time',
      endTime: 'end_time',
      timeOffset: 'time_offset',
      stage: 'stage',
      sleepId: 'sleep_id',
    }

    super({
      recordsTable: sleepStagesTable,
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
        if (!data[headersMap.stage]) {
          throw new Error('Missing stage')
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

        const sleepRecord = await db.query.sleepRecordsTable.findFirst({
          where: eq(sleepRecordsTable.samsungSleepId, data[headersMap.sleepId]),
        })

        if (!sleepRecord) {
          throw new Error(
            `Sleep record not found for sleep stage ${
              data[headersMap.dataUuid]
            }`
          )
        }

        const toStageEnum = (rawStage: number) => {
          if (rawStage === 40001) {
            return 'awake'
          }
          if (rawStage === 40002) {
            return 'light'
          }
          if (rawStage === 40003) {
            return 'deep'
          }
          if (rawStage === 40004) {
            return 'rem'
          }
          throw new Error(`Invalid stage ${rawStage}`)
        }

        const stage = toStageEnum(data[headersMap.stage])

        const dbEntry: NewSleepStage = {
          startTime: startTime.toJSDate(),
          endTime: endTime.toJSDate(),
          stage,
          sleepRecordId: sleepRecord.id,
          samsungSleepId: data[headersMap.sleepId],
          timezone: offsetToTimezone(data[headersMap.timeOffset]),

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
    const fromDate = await db.query.sleepStagesTable.findFirst({
      orderBy: desc(sleepStagesTable.startTime),
    })

    this.fromDate = fromDate
      ? DateTime.fromJSDate(fromDate.startTime, { zone: 'UTC' })
      : null

    return super.import(params)
  }
}

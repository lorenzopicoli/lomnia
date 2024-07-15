import type { DBTransaction } from '../../../db/types'
import { BaseImporter } from '../BaseImporter'
import { parse } from 'csv-parse'
import * as fs from 'node:fs'
import {
  heartRateReadingsTable,
  type NewHeartRateReading,
} from '../../../models/HeartRateReading'
import { DateTime, FixedOffsetZone } from 'luxon'

export class SamsungHealthHeartRateImport extends BaseImporter {
  override sourceId = 'samsung-health-export-hr-v1'
  override destinationTable = 'heart_rate_readings'
  override entryDateKey = 'com.samsung.health.heart_rate.create_time'

  private baseExportPath: string
  private csvPath: string

  private identifier = 'com.samsung.shealth.tracker.heart_rate'

  private headersMap = {
    source: 'source',
    tagId: 'tag_id',
    createShVer: 'com.samsung.health.heart_rate.create_sh_ver',
    heartBeatCount: 'com.samsung.health.heart_rate.heart_beat_count',
    startTime: 'com.samsung.health.heart_rate.start_time',
    custom: 'com.samsung.health.heart_rate.custom',
    binningData: 'com.samsung.health.heart_rate.binning_data',
    modifyShVer: 'com.samsung.health.heart_rate.modify_sh_ver',
    updateTime: 'com.samsung.health.heart_rate.update_time',
    createTime: 'com.samsung.health.heart_rate.create_time',
    max: 'com.samsung.health.heart_rate.max',
    min: 'com.samsung.health.heart_rate.min',
    timeOffset: 'com.samsung.health.heart_rate.time_offset',
    deviceUuid: 'com.samsung.health.heart_rate.deviceuuid',
    comment: 'com.samsung.health.heart_rate.comment',
    packageName: 'com.samsung.health.heart_rate.pkg_name',
    endTime: 'com.samsung.health.heart_rate.end_time',
    dataUuid: 'com.samsung.health.heart_rate.datauuid',
    heartRate: 'com.samsung.health.heart_rate.heart_rate',
  }

  constructor() {
    super()
    if (!process.env.SAMSUNG_HEALTH_FOLDER) {
      throw new Error('Missing env var SAMSUNG_HEALTH_FOLDER')
    }
    // Regex to match any folder name ending with the date-time part
    const folderRegex = /_(\d{14})$/
    if (!process.env.SAMSUNG_HEALTH_FOLDER) {
      throw new Error('Missing env var SAMSUNG_HEALTH_FOLDER')
    }
    const folders = fs
      .readdirSync(process.env.SAMSUNG_HEALTH_FOLDER)
      .filter((folder) => folderRegex.test(folder))
      .map((folder) => {
        const match = folder.match(folderRegex)
        if (match) {
          return {
            name: folder,
            date: match[1],
          }
        }
        return null
      })
      .filter((item) => item !== null) as { name: string; date: string }[]

    if (folders.length === 0) {
      throw new Error('No Samsung Health export folders found')
    }
    folders.sort((a, b) => b.date.localeCompare(a.date))

    this.baseExportPath = `${process.env.SAMSUNG_HEALTH_FOLDER}/${folders[0].name}`
    this.csvPath = `${this.baseExportPath}/${this.identifier}.${folders[0].date}.csv`
  }

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: Date
    totalEstimate?: number
  }> {
    return { result: true }
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
    let importedCount = 0
    const batchSize = 100
    let entriesToSave: NewHeartRateReading[] = []

    if (!process.env.SAMSUNG_HEALTH_FOLDER) {
      throw new Error('Missing env var SAMSUNG_HEALTH_FOLDER')
    }

    for await (const record of this.readCsvFile()) {
      const binnedData = record[this.headersMap.binningData]
        ? this.getBinnedData(record[this.headersMap.binningData])
        : undefined
      const newEntries: NewHeartRateReading[] = binnedData?.map((d: any) => ({
        ...this.formatCsvRowToRecord(record, d),
        importJobId: params.placeholderJobId,
      })) ?? [
        {
          ...this.formatCsvRowToRecord(record),
          importJobId: params.placeholderJobId,
        },
      ]
      console.log(newEntries)
      entriesToSave = entriesToSave.concat(newEntries)

      if (entriesToSave.length >= batchSize) {
        await params.tx.insert(heartRateReadingsTable).values(entriesToSave)
        importedCount += entriesToSave.length
        entriesToSave = []
      }
    }

    await params.tx.insert(heartRateReadingsTable).values(entriesToSave)
    importedCount += entriesToSave.length
    entriesToSave = []
    return {
      importedCount,
      apiCallsCount: 0,
      logs: [],
    }
  }

  private readCsvFile() {
    return fs.createReadStream(this.csvPath).pipe(
      parse({
        columns: true,
        relaxColumnCount: true,
        fromLine: 2,
        skipEmptyLines: true,
        cast: true,
        castDate: false,
      })
    )
  }

  private formatCsvRowToRecord(
    row: any,
    binnedData?: any
  ): Omit<NewHeartRateReading, 'importJobId'> {
    const timezoneRaw = row[this.headersMap.timeOffset]
    const zone = FixedOffsetZone.parseSpecifier(timezoneRaw.slice(0, -2))
    const timezone =
      zone.name.indexOf('-') > -1
        ? zone.name.replace('-', '+')
        : zone.name.replace('+', '-')

    if (!zone.isValid) {
      throw new Error('Invalid timezone: ' + timezoneRaw)
    }

    return {
      startTime: binnedData
        ? DateTime.fromMillis(binnedData.start_time).toJSDate()
        : DateTime.fromSQL(row[this.headersMap.startTime]).toJSDate(),
      endTime: binnedData
        ? DateTime.fromMillis(binnedData.end_time).toJSDate()
        : DateTime.fromSQL(row[this.headersMap.endTime]).toJSDate(),
      heartRate: binnedData?.heart_rate ?? row[this.headersMap.heartRate],
      heartRateMax: binnedData?.heart_rate_max ?? row[this.headersMap.max],
      heartRateMin: binnedData?.heart_rate_min ?? row[this.headersMap.min],
      timezone,
      comment: row[this.headersMap.comment],
      binUuid: row[this.headersMap.dataUuid],
      dataExportId: row[this.headersMap.dataUuid],
    }
  }

  private getBinnedData(binFileName: string) {
    const fullPath = `${this.baseExportPath}/jsons/${
      this.identifier
    }/${binFileName.charAt(0)}/${binFileName}`

    return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
  }
}

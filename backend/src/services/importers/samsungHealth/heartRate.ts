import type { DBTransaction } from '../../../db/types'
import { BaseImporter } from '../BaseImporter'
import { parse } from 'csv-parse'
import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import {
  heartRateReadingsTable,
  type NewHeartRateReading,
} from '../../../models/HeartRateReading'

export class SamsungHealthHeartRateImport extends BaseImporter {
  override sourceId = 'samsung-health-export-hr-v1'
  override destinationTable = 'heart_rate_readings'
  override entryDateKey = 'com.samsung.health.heart_rate.create_time'

  private headers = [
    'source',
    'tag_id',
    'com.samsung.health.heart_rate.create_sh_ver',
    'com.samsung.health.heart_rate.heart_beat_count',
    'com.samsung.health.heart_rate.start_time',
    'com.samsung.health.heart_rate.custom',
    'com.samsung.health.heart_rate.binning_data',
    'com.samsung.health.heart_rate.modify_sh_ver',
    'com.samsung.health.heart_rate.update_time',
    'com.samsung.health.heart_rate.create_time',
    'com.samsung.health.heart_rate.max',
    'com.samsung.health.heart_rate.min',
    'com.samsung.health.heart_rate.time_offset',
    'com.samsung.health.heart_rate.deviceuuid',
    'com.samsung.health.heart_rate.comment',
    'com.samsung.health.heart_rate.pkg_name',
    'com.samsung.health.heart_rate.end_time',
    'com.samsung.health.heart_rate.datauuid',
    'com.samsung.health.heart_rate.heart_rate',
  ]

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
      if (!record['com.samsung.health.heart_rate.binning_data']) {
        throw new Error('Missing binning data')
      }
      const binnedData = this.getBinnedData(
        record['com.samsung.health.heart_rate.binning_data']
      )
      const newEntries: NewHeartRateReading[] = binnedData.map((d: any) => ({
        ...this.formatCsvRowToRecord(d),
        importJobId: params.placeholderJobId,
      }))
      entriesToSave = entriesToSave.concat(newEntries)

      if (entriesToSave.length >= batchSize) {
        await params.tx.insert(heartRateReadingsTable).values(entriesToSave)
        importedCount += entriesToSave.length
        entriesToSave = []
      }
    }

    if (entriesToSave.length >= batchSize) {
      await params.tx.insert(heartRateReadingsTable).values(entriesToSave)
      importedCount += entriesToSave.length
      entriesToSave = []
    }
    if (isFinite(1)) {
      throw new Error('rollback')
    }
    // this.updateFirstAndLastEntry(new Date())
    return {
      importedCount,
      apiCallsCount: 0,
      logs: [],
    }
  }

  private readCsvFile() {
    return fs
      .createReadStream(
        `${process.env.SAMSUNG_HEALTH_FOLDER}/samsunghealth_lorenzopicoli_20240626170954/com.samsung.shealth.tracker.heart_rate.20240626170954.csv`
      )
      .pipe(
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
    row: any
  ): Omit<NewHeartRateReading, 'importJobId'> {
    return {
      startTime: row['com.samsung.health.heart_rate.start_time'],
      endTime: row['com.samsung.health.heart_rate.end_time'],
      heartRate: row['com.samsung.health.heart_rate.heart_rate'],
      heartRateMax: row['com.samsung.health.heart_rate.max'],
      heartRateMin: row['com.samsung.health.heart_rate.min'],
      timezone: row['com.samsung.health.heart_rate.timezone'],
      comment: row['com.samsung.health.heart_rate.comment'],
      binUuid: row['com.samsung.health.heart_rate.binning_data'],
      dataExportId: row['com.samsung.health.heart_rate.datauuid'],
    }
  }

  private getBinnedData(binFileName: string) {
    const fullPath = `${
      process.env.SAMSUNG_HEALTH_FOLDER
    }/samsunghealth_lorenzopicoli_20240626170954/jsons/com.samsung.shealth.tracker.heart_rate/${binFileName.charAt(
      0
    )}/${binFileName}`

    return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
  }
}

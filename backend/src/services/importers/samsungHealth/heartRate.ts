import type { DBTransaction } from '../../../db/types'
import { BaseImporter } from '../BaseImporter'
import { parse } from 'csv-parse'
import * as fs from 'node:fs'

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

    if (!process.env.SAMSUNG_HEALTH_FOLDER) {
      throw new Error('Missing env var SAMSUNG_HEALTH_FOLDER')
    }
    const parser = fs
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
    for await (const record of parser) {
      console.log('Record', record)
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
}

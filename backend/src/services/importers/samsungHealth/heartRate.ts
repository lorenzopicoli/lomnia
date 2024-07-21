import { heartRateTable, type NewHeartRate } from '../../../models/HeartRate'
import { DateTime } from 'luxon'
import { BaseSamsungHealthImporter } from '.'
import { offsetToTimezone } from '../../../helpers/offsetToTimezone'

export class SamsungHealthHeartRateImporter extends BaseSamsungHealthImporter<NewHeartRate> {
  override sourceId = 'samsung-health-export-hr-v1'
  override destinationTable = 'heart_rate_readings'
  override entryDateKey = 'com.samsung.health.heart_rate.start_time'

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
      onNewBinnedData: (csvRow: any, binnedData: any, importJobId: number) => {
        return {
          startTime: DateTime.fromMillis(binnedData.start_time).toJSDate(),
          endTime: DateTime.fromMillis(binnedData.end_time).toJSDate(),
          heartRate: binnedData.heart_rate,
          heartRateMax: binnedData.heart_rate_max,
          heartRateMin: binnedData.heart_rate_min,
          timezone: offsetToTimezone(csvRow[headersMap.timeOffset]),
          comment: csvRow[headersMap.comment],
          binUuid: csvRow[headersMap.dataUuid],
          dataExportId: csvRow[headersMap.dataUuid],
          importJobId,
        }
      },
      onNewRow: (row: any, importJobId: number) => {
        return {
          startTime: DateTime.fromSQL(row[headersMap.startTime]).toJSDate(),
          endTime: DateTime.fromSQL(row[headersMap.endTime]).toJSDate(),
          heartRate: row[headersMap.heartRate],
          heartRateMax: row[headersMap.max],
          heartRateMin: row[headersMap.min],
          timezone: offsetToTimezone(row[headersMap.timeOffset]),
          comment: row[headersMap.comment],
          binUuid: row[headersMap.dataUuid],
          dataExportId: row[headersMap.dataUuid],
          importJobId,
        }
      },
    })
  }
}

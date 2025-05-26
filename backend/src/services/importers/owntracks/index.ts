import { BaseImporter } from '../BaseImporter'
import { toPostgisGeoPoint, type DBTransaction } from '../../../db/types'
import { record, z } from 'zod'
import data from './personal.json'
import { locationsTable, type Location, type NewLocation } from '../../../models'
import { eq, sql } from 'drizzle-orm'
import { locationDetailsTable } from '../../../models/LocationDetails'
import axios from 'axios'
import { DateTime } from 'luxon'
import { parseOwnTracksApiResponse, parseOwnTracksLocation, type OwnTracksLocation } from './schema'

export class OwntracksImporter extends BaseImporter {
  override sourceId = 'owntracks-api'
  override destinationTable = 'locations'
  override entryDateKey = ''
  override apiVersion = 'v1'

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: DateTime
    totalEstimate?: number
  }> {
    return { result: true }
  }

  public async import(params: {
    tx: DBTransaction
    placeholderJobId: number
    from?: DateTime
  }): Promise<{
    importedCount: number
    firstEntryDate: Date
    lastEntryDate: Date
    apiCallsCount?: number
    logs: string[]
  }> {
    const url = process.env.OWNTRACKS_HTTP_SERVER
    if (!url) {
      throw new Error('OWNTRACKS_HTTP_SERVER env var is required')
    }

    const { tx, placeholderJobId } = params
    let importedCount = 0
    let apiCallsCount = 0

    const http = axios.create({
      baseURL: url,
    })

    const currentDate = DateTime.now().plus({ days: 1 })

    while (true) {
      const response = await http.get('/api/0/locations', {
        params: {
          user: 'owntracks',
          device: 'shiba',
        },
        headers: {
          'X-Limit-From': currentDate.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
          'X-Limit-To': currentDate.toFormat('yyyy-MM-dd'),
        },
      })
      apiCallsCount++

      const recordings = parseOwnTracksApiResponse(response.data)
      if (recordings.count === 0) {
        break
      }
      const { lat, lng, radiusInMeters, ...rest } = recordings

      const locations = await tx
        .insert(locationsTable)
        .values({})
        .returning({ id: locationsTable.id })

      importedCount += locations.length
    }

    return {
      importedCount,
      firstEntryDate: this.firstEntry ?? new Date(),
      lastEntryDate: this.lastEntry ?? new Date(),
      apiCallsCount,
      logs: [],
    }
  }

  private formatApiEntry(entry: OwnTracksLocation): NewLocation {
    return {
      externalId: entry._id ?? ,
      accuracy: importerData.accuracy,
      verticalAccuracy: importerData.verticalAccuracy,
      velocity: importerData.velocity,
      altitude: importerData.altitude,
      battery: importerData.battery,
      batteryStatus,
      connectionStatus,
      location: { lat: importerData.latitude, lng: importerData.longitude },

      source: 'sqlite_locations',

      trigger,

      topic: importerData.originalPublishTopic,
      wifiSSID: importerData.wifiSSID,
      rawData: importerData,

      importJobId: jobId,

      messageCreatedAt: importerData.messageCreationTime,
      locationFix: importerData[this.entryDateKey],

      timezone,

      createdAt: new Date(),
    }
  }
}

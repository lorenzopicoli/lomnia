import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { type ImporterLocation, importerLocationsEventsTable } from './schema'
import db from '../../db/db'
import {
  type ImportJob,
  importJobsTable,
  locationsTable,
  type NewLocation,
} from '../../db/schema'
import { asc, desc, gt, sql } from 'drizzle-orm'

const sqlite = new Database('sqlite.db')

class MissingFieldError extends Error {}

class UnexpectedValueError extends Error {}

export class LocationImporter {
  private sqliteConn: BetterSQLite3Database
  private sourceId = 'sqlite-locations_events-v1'
  private importBatchSize = 3000

  constructor(filePath: string) {
    const sqlite = new Database(filePath)
    this.sqliteConn = drizzle(sqlite, { logger: true })
  }

  public mapData(jobId: number, importerData: ImporterLocation): NewLocation {
    if (!importerData.id) {
      throw new MissingFieldError('id')
    }
    if (
      importerData.batteryStatus === undefined ||
      importerData.batteryStatus === null
    ) {
      throw new MissingFieldError('batteryStatus')
    }
    if (!importerData.latitude) {
      throw new MissingFieldError('latitude')
    }
    if (!importerData.longitude) {
      throw new MissingFieldError('longitude')
    }

    /**
     *
     * w phone is connected to a WiFi connection (iOS,Android)
     * o phone is offline (iOS,Android)
     * m mobile data (iOS,Android)
     * https://owntracks.org/booklet/tech/json/
     */
    const connectionMap: Record<
      NonNullable<ImporterLocation['connectionStatus']>,
      NewLocation['connectionStatus']
    > = {
      w: 'wifi',
      o: 'offline',
      m: 'data',
    }
    const connectionStatus = importerData.connectionStatus
      ? connectionMap[importerData.connectionStatus] ?? null
      : null

    /**
     * Battery Status 0=unknown, 1=unplugged, 2=charging, 3=full
     * https://owntracks.org/booklet/tech/json/
     */
    const batteryMap: Record<
      NonNullable<ImporterLocation['batteryStatus']>,
      NewLocation['batteryStatus']
    > = {
      0: 'unknown',
      1: 'unplugged',
      2: 'charging',
      3: 'full',
    }
    const batteryStatus = batteryMap[importerData.batteryStatus] ?? null

    if (!batteryStatus) {
      throw new UnexpectedValueError(
        `batteryStatus = ${importerData.batteryStatus}`
      )
    }

    /**
     * p ping issued randomly by background task (iOS,Android)
     * c circular region enter/leave event (iOS,Android)
     * b beacon region enter/leave event (iOS)
     * r response to a reportLocation cmd message (iOS,Android)
     * u manual publish requested by the user (iOS,Android)
     * t timer based publish in move move (iOS)
     * v updated by Settings/Privacy/Locations Services/System Services/Frequent Locations monitoring (iOS)
     */
    const triggerMap: Record<
      NonNullable<ImporterLocation['triggerType']>,
      NewLocation['trigger']
    > = {
      p: 'ping',
      c: 'circular',
      u: 'manual',
      r: 'report_location',
    }
    const trigger = importerData.triggerType
      ? triggerMap[importerData.triggerType] ?? null
      : null

    return {
      externalId: importerData.id,
      accuracy: importerData.accuracy,
      verticalAccuracy: importerData.verticalAccuracy,
      velocity: importerData.velocity,
      altitude: importerData.altitude,
      battery: importerData.battery,
      batteryStatus,
      connectionStatus,
      location: { lat: importerData.latitude, lng: importerData.longitude },

      trigger,

      topic: importerData.originalPublishTopic,
      wifiSSID: importerData.wifiSSID,
      rawData: importerData,

      importJobId: jobId,

      messageCreatedAt: importerData.messageCreationTime,
      locationFix: importerData.timestamp,
    }
  }

  public async import() {
    const jobStart = new Date()
    const lastJob: ImportJob | undefined = await db
      .select()
      .from(importJobsTable)
      .where(sql`${importJobsTable.source} = ${this.sourceId}`)
      .orderBy(desc(importJobsTable.lastEntryDate))
      .limit(1)
      .then((r) => r[0])

    const startDate = lastJob?.lastEntryDate

    let firstEntryDate: ImportJob['firstEntryDate'] | undefined
    let lastEntryDate: ImportJob['lastEntryDate'] | undefined
    let importedCount = 0
    let currentOffset = 0
    let events: ImporterLocation[] | undefined
    let jobId: number | undefined

    await db.transaction(async (tx) => {
      const placeholderJob = await tx
        .insert(importJobsTable)
        .values({
          jobStart: new Date(),
          jobEnd: new Date(),
          firstEntryDate: new Date(),
          lastEntryDate: new Date(),
          entryDateKey: '',
          destinationTable: '',
          source: '',
          importedCount: 0,
          logs: [],
          createdAt: new Date(),
        })
        .returning({ id: importJobsTable.id })
        .then((r) => r[0])

      if (!placeholderJob.id) {
        throw new Error('Failed to insert placeholder job')
      }
      while (events?.length !== 0) {
        console.log(
          `Processing event ${currentOffset} to ${
            currentOffset + this.importBatchSize
          }`
        )
        events = await this.sqliteConn
          .select()
          .from(importerLocationsEventsTable)
          .where(
            startDate
              ? gt(importerLocationsEventsTable.timestamp, startDate)
              : undefined
          )
          .orderBy(asc(importerLocationsEventsTable.timestamp))
          .limit(this.importBatchSize)
          .offset(currentOffset)

        if (!firstEntryDate) {
          firstEntryDate = events[0]?.timestamp ?? undefined
        }
        lastEntryDate = events[events.length - 1]?.timestamp ?? undefined
        importedCount += events.length
        currentOffset += this.importBatchSize

        if (events.length > 0) {
          await tx
            .insert(locationsTable)
            .values(events.map((e) => this.mapData(placeholderJob.id, e)))
        }
      }
    })
  }
}

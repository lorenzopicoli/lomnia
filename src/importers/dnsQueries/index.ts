import Database from 'better-sqlite3'
import { differenceInSeconds, intervalToDuration } from 'date-fns'
import { asc, desc, eq, getTableName, gt, sql } from 'drizzle-orm'
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3'
import type { SQLiteSelectQueryBuilder } from 'drizzle-orm/sqlite-core'
import { isNil } from 'lodash'
import type { NodeSSH } from 'node-ssh'
import { db } from '../../db/connection'
import {
  type ImportJob,
  type NewDnsQuery,
  dnsQueriesTable,
  importJobsTable,
} from '../../db/schema'
import type { DBTransaction } from '../../db/types'
import { MissingFieldError, UnexpectedValueError } from '../../errors'
import progressLog from '../../helpers/progressLog'
import { downloadFile, newSSHConnection } from '../ssh'
import externalDnsQueriesSchema from './schema/externalDnsQueriesSchema'
import { type ExternalDnsQuery, externalDnsQueriesTable } from './schema/tables'

export class ExternalDnsRequestImporter {
  private importDb: BetterSQLite3Database<typeof externalDnsQueriesSchema>
  private sourceId = 'sqlite-dns-requests-v1'
  private destinationTable = getTableName(dnsQueriesTable)
  private entryDateKey = 'timestamp' as const
  private importBatchSize = 3000
  private placeholderDate = new Date(1997, 6, 6)

  private localPath = '/home/lorenzo/test/dns_queries.db'

  private jobStart = new Date()

  constructor() {
    const sqlite = new Database(this.localPath)
    this.importDb = drizzle(sqlite, {
      logger: false,
      schema: externalDnsQueriesSchema,
    })
  }

  private withFilters<T extends SQLiteSelectQueryBuilder>(
    qb: T,
    startDate?: Date
  ) {
    return qb
      .where(
        startDate
          ? gt(externalDnsQueriesTable[this.entryDateKey], startDate)
          : undefined
      )
      .orderBy(asc(externalDnsQueriesTable[this.entryDateKey]))
  }

  private fetchFromSource(offset: number, startDate?: Date) {
    const query = this.importDb.select().from(externalDnsQueriesTable)

    return this.withFilters(query.$dynamic(), startDate)
      .orderBy(asc(externalDnsQueriesTable[this.entryDateKey]))
      .limit(this.importBatchSize)
      .offset(offset)
  }

  public async fetchDataForImport(connection?: NodeSSH) {
    const conn = connection ?? (await newSSHConnection('192.168.40.2'))
    await downloadFile(conn, this.localPath, '/home/lorenzo/pihole-backup.db')
    if (!connection) {
      conn.dispose()
    }
  }

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: Date
    totalEstimate: number
  }> {
    const lastJob = await db.query.importJobsTable.findFirst({
      where: eq(importJobsTable.source, this.sourceId),
      orderBy: desc(importJobsTable.lastEntryDate),
    })

    const startDate = lastJob?.lastEntryDate

    const countQuery = this.importDb
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(externalDnsQueriesTable)

    const count = await this.withFilters(countQuery.$dynamic(), startDate).then(
      (r) => r[0]?.count
    )

    return {
      totalEstimate: count,
      result: count > 0,
      from: startDate,
    }
  }

  private async importInternal(params: {
    tx: DBTransaction
    from?: Date
    totalEstimate: number
  }) {
    const { tx, from, totalEstimate } = params
    let firstEntryDate: ImportJob['firstEntryDate'] | undefined
    let lastEntryDate: ImportJob['lastEntryDate'] | undefined
    let importedCount = 0
    let currentOffset = 0
    let events: ExternalDnsQuery[] | undefined

    const placeholderJob = await tx
      .insert(importJobsTable)
      .values({
        source: this.sourceId,
        destinationTable: this.destinationTable,
        entryDateKey: this.entryDateKey,

        jobStart: this.jobStart,
        jobEnd: this.placeholderDate,
        firstEntryDate: this.placeholderDate,
        lastEntryDate: this.placeholderDate,

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
      events = await this.fetchFromSource(currentOffset, from)
      currentOffset += this.importBatchSize
      if (events.length > 0) {
        await tx
          .insert(dnsQueriesTable)
          .values(events.map((e) => this.mapData(placeholderJob.id, e)))

        const firstEntry: ExternalDnsQuery | undefined = events[0]
        const lastEntry: ExternalDnsQuery | undefined =
          events[events.length - 1]

        if (!firstEntryDate && firstEntry?.[this.entryDateKey]) {
          firstEntryDate = firstEntry[this.entryDateKey] ?? undefined
        }
        if (lastEntry?.[this.entryDateKey]) {
          lastEntryDate = lastEntry[this.entryDateKey] ?? undefined
        }

        importedCount += events.length
        console.log(
          `DNS Queries external import progress: ${importedCount}/${totalEstimate}. ETA: ${progressLog(
            this.jobStart,
            totalEstimate,
            importedCount
          )}...`
        )
      }
    }

    if (importedCount === 0) {
      return tx.rollback()
    }

    await tx
      .update(importJobsTable)
      .set({
        jobEnd: new Date(),
        firstEntryDate,
        lastEntryDate,

        importedCount,
        logs: [],
        createdAt: new Date(),
      })
      .where(eq(importJobsTable.id, placeholderJob.id))
  }

  public async import() {
    const { result, from, totalEstimate } = await this.sourceHasNewData()
    if (!result) {
      console.log('No new data found for DNS queries')
      return
    }

    await db
      .transaction(async (tx) => {
        await this.importInternal({ tx, from, totalEstimate })
      })
      .catch((e) => console.log('NOTHING E', e))
  }

  public mapData(jobId: number, importerData: ExternalDnsQuery): NewDnsQuery {
    const {
      id,
      timestamp,
      type,
      status,
      domain,
      client,
      replyType,
      forward,
      replyTime,
      additionalInfo,
      dnssec,
    } = importerData
    if (isNil(id)) {
      throw new MissingFieldError('id')
    }
    if (isNil(timestamp)) {
      throw new MissingFieldError('timestamp')
    }
    if (isNil(type)) {
      throw new MissingFieldError('type')
    }
    if (isNil(status)) {
      throw new MissingFieldError('status')
    }
    if (isNil(domain)) {
      throw new MissingFieldError('domain')
    }
    if (isNil(client)) {
      throw new MissingFieldError('client')
    }
    if (isNil(replyType)) {
      throw new MissingFieldError('replyType')
    }

    return {
      externalId: importerData.id,
      importJobId: jobId,
      queryTimestamp: timestamp,
      domain,
      client,
      forward,
      replyTime: isNil(replyTime) ? null : Math.round(replyTime * 1000),
      replyType,
      additionalInfo,
      type,
      status,
      dnssec,
    }
  }
}

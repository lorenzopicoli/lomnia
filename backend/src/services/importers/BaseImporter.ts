import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { db } from '../../db/connection'
import type { DBTransaction } from '../../db/types'
import { importJobsTable } from '../../models/ImportJob'

export class BaseImporter {
  sourceId!: string
  destinationTable!: string
  entryDateKey!: string
  apiVersion?: string
  placeholderDate = new Date(1997, 6, 6)

  jobStart = DateTime.now()

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: Date
    totalEstimate?: number
  }> {
    throw new Error('sourceHasNewData not implemented')
  }

  public async startJob() {
    const { result, from, totalEstimate } = await this.sourceHasNewData()
    console.log(`Importing data from ${this.sourceId}`)
    if (!result) {
      console.log(`No new data found ${this.sourceId}`)
      return
    }

    await db
      .transaction(async (tx) => {
        const placeholderJobId = await tx
          .insert(importJobsTable)
          .values({
            source: this.sourceId,
            destinationTable: this.destinationTable,
            entryDateKey: this.entryDateKey,

            jobStart: this.jobStart.toJSDate(),
            jobEnd: this.placeholderDate,
            firstEntryDate: this.placeholderDate,
            lastEntryDate: this.placeholderDate,

            importedCount: 0,
            logs: [],
            createdAt: new Date(),
          })
          .returning({ id: importJobsTable.id })
          .then((r) => r[0])

        if (!placeholderJobId.id) {
          throw new Error('Failed to insert placeholder job')
        }

        const result = await this.import({
          tx,
          placeholderJobId: placeholderJobId.id,
        })

        if (result.importedCount === 0) {
          return tx.rollback()
        }

        await tx
          .update(importJobsTable)
          .set({
            jobEnd: new Date(),
            firstEntryDate: result.firstEntryDate,
            lastEntryDate: result.lastEntryDate,
            apiCallsCount: result.apiCallsCount,
            apiVersion: this.apiVersion,

            importedCount: result.importedCount,
            logs: [],
            createdAt: new Date(),
          })
          .where(eq(importJobsTable.id, placeholderJobId.id))
      })
      .catch((e) => console.log('NOTHING E', e))

    console.log('Done importing', this.sourceId)
  }

  public async import(_params: {
    tx: DBTransaction
    placeholderJobId: number
  }): Promise<{
    importedCount: number
    firstEntryDate: Date
    lastEntryDate: Date
    apiCallsCount?: number
    logs: string[]
  }> {
    throw new Error('Import not implemented')
  }
}

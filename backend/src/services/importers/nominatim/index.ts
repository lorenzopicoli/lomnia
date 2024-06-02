import { sql } from 'drizzle-orm'
import { db } from '../../../db/connection'
import { BaseImporter } from '../BaseImporter'
import { locationsTable } from '../../../models'
import type { DBTransaction } from '../../../db/types'

export class NominatimImport extends BaseImporter {
  override sourceId = 'nomatim-v1'
  override apiVersion = 'https://nominatim.openstreetmap.org/'
  override destinationTable = 'location_details'
  override entryDateKey = 'date'
  private importBatchSize = 50

  // Defines how precise or close to each other the points are. The lower the number, the more api calls we'll
  // do and the more granularity we'll have.
  // I also believe that changing this would trigger a refetch of effectively all the locations in the database
  // since the location/date pairs wouldn't match the exisiting weather entries anymore
  private gridPrecision = '0.01'

  // In ms
  private apiCallsDelay = 1000
  private apiUrl = this.apiVersion

  public async sourceHasNewData(): Promise<{
    result: boolean
    from?: Date
    totalEstimate?: number
  }> {
    const count = await db
      .select({
        count: sql`COUNT(id)`.mapWith(Number),
      })
      .from(locationsTable).where(sql`
        (
        ${locationsTable.locationDetailsId} IS NULL
        )
    `)

    const value = count[0].count ?? 0
    return { result: value > 0, totalEstimate: value }
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

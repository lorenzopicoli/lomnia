# lomnia

1. Install dependencies

```
npm i
```

2. Spin up local postgres db using docker

```
docker compose up
```

3. Access PGAdmin in http://localhost:8888

   - Email: lomnia@lomnia.com
   - Password: lomnia

4. Connect to the database:

   - Username: lomnia
   - Password: lomnia
   - Host: db

5. Rename the `.env.example` file to `.env`

6. Run migrations with `npm run migration:up`

# Notes

- knex is used to manage migrations
- `ts-node` is required for knex to properly work, but `tsx` is what is actually used for everything else
- `postgres` is used by drizzle, but `pg` is required by knex (feels like I need to consolidate this)

---

# Importer template

```
import type { DBTransaction } from '../../../db/types'
import { BaseImporter } from '../BaseImporter'

export class SamsungHealthHeartRateImport extends BaseImporter {
  override sourceId = 'samsung-health-export-hr-v1'
  override destinationTable = 'heart_rate_readings'
  override entryDateKey = 'com.samsung.health.heart_rate.create_time'

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
    this.updateFirstAndLastEntry(new Date())
    return {
      importedCount,
      apiCallsCount: 0,
      logs: [],
    }
  }
}
```

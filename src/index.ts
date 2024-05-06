import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const runMigrations = async () => {
  const sql = postgres(
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`,
    {
      max: 1,
    }
  )
  const db = drizzle(sql)

  await migrate(db, { migrationsFolder: 'migrations' })

  await sql.end()
}

runMigrations()

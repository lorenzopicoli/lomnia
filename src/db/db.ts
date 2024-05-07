import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const conn = postgres(
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`
)

export default drizzle(conn, { logger: false })

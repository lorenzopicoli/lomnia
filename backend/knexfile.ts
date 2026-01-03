import "dotenv/config";
import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ?? (5432 as any),
    },
    migrations: {
      directory: "./src/migrations",
    },
  },
  production: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ?? (5432 as any),
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./build/src/migrations",
    },
  },
};

export default config;

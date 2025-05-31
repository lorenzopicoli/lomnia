import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models";

const conn = postgres(
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${
    process.env.DB_HOST
  }:${process.env.DB_PORT ?? 5432}/${process.env.DB_NAME}`,
);

export const db = drizzle(conn, { schema, logger: false });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { EnvVar, getEnvVarOrError, getEnvVarOrNull } from "../helpers/envVars";
import * as schema from "../models";

const dbConfig = {
  host: getEnvVarOrError(EnvVar.DB_HOST),
  user: getEnvVarOrError(EnvVar.DB_USER),
  password: getEnvVarOrNull(EnvVar.DB_PASSWORD) ?? undefined,
  database: getEnvVarOrError(EnvVar.DB_NAME),
  port: getEnvVarOrError(EnvVar.DB_PORT),
};

const conn = postgres(
  `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
);

export const db = drizzle(conn, { schema, logger: false });

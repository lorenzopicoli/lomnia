import * as fs from "node:fs";
import readline from "node:readline";
import zlib from "node:zlib";
import { eq } from "drizzle-orm";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import { importJobsTable } from "../../models";
import { Logger } from "../Logger";
import type { Ingester } from "./BaseIngester";
import { DeviceIngester } from "./DeviceIngester";
import { DeviceStatusIngester } from "./DeviceStatusIngester";
import { LocationIngester } from "./LocationIngester";

const ingestersClasses = [LocationIngester, DeviceStatusIngester, DeviceIngester];

const logger = new Logger("IngesterIndex");

async function ingest(params: { data: unknown; ingesters: Ingester<any, any>[] }): Promise<number> {
  const { data, ingesters } = params;
  for (const ingester of ingesters) {
    const { insertedCount, wasIngested } = await ingester.tryIngest(data);
    if (wasIngested) {
      return insertedCount ?? 0;
    }
  }
  logger.error("No ingester could ingest line", data);
  return 0;
}

export async function ingestFile(filePath: string) {
  try {
    logger.info("Starting Ingestion", {
      filePath,
    });
    const start = DateTime.now().toJSDate();
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    let importedCount = 0;
    const transactionConfig: PgTransactionConfig = {
      isolationLevel: "read committed",
      accessMode: "read write",
      deferrable: true,
    };
    let lineCount = 0;
    let lastLogAt = Date.now();
    const LOG_EVERY_LINES = 50_000;
    const LOG_EVERY_MS = 5_000;
    await db.transaction(async (tx) => {
      const placeholderJobId = await tx
        .insert(importJobsTable)
        .values({
          jobStart: start,
          jobEnd: start,
          importedCount: 0,
          logs: [],
          createdAt: new Date(),
        })
        .returning({ id: importJobsTable.id })
        .then((r) => r[0]);

      if (!placeholderJobId.id) {
        throw new Error("Failed to insert placeholder job");
      }

      const ingesterInstances = ingestersClasses.map((c) => new c(placeholderJobId.id, tx));

      const rl = readline.createInterface({
        input: fileStream.pipe(gunzip),
        crlfDelay: Infinity, // handles \r\n and \n
      });

      for await (const line of rl) {
        if (!line) {
          continue;
        }
        lineCount++;

        const ingestedCount = await ingest({
          ingesters: ingesterInstances,
          data: JSON.parse(line),
        });
        importedCount += ingestedCount;

        const now = Date.now();
        if (lineCount % LOG_EVERY_LINES === 0 || now - lastLogAt >= LOG_EVERY_MS) {
          const elapsedSec = (now - start.getTime()) / 1000;
          const rate = Math.round(lineCount / elapsedSec);

          logger.info("Ingestion progress", {
            linesRead: lineCount,
            rowsInserted: importedCount,
            elapsedSec: elapsedSec.toFixed(1),
            linesPerSec: rate,
          });

          lastLogAt = now;
        }
      }

      // Flushes any pending ingestions that were collected, but
      // not commited yet
      for (const ingester of ingesterInstances) {
        importedCount += await ingester.flush();
      }
      logger.info("Ingestion finished", {
        linesRead: lineCount,
        rowsInserted: importedCount,
      });

      const end = DateTime.now().toJSDate();

      await tx
        .update(importJobsTable)
        .set({
          jobEnd: end,
          importedCount: importedCount,
          createdAt: new Date(),
        })
        .where(eq(importJobsTable.id, placeholderJobId.id));
    }, transactionConfig);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

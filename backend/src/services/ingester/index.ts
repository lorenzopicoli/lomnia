import * as fs from "node:fs";
import readline from "node:readline";
import zlib from "node:zlib";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import type { DBTransaction } from "../../db/types";
import { importJobsTable } from "../../models";
import { DeviceIngester } from "./DeviceIngester";
import { DeviceStatusIngester } from "./DeviceStatusIngester";
import { LocationIngester } from "./LocationIngester";

const ingesters = [LocationIngester, DeviceStatusIngester, DeviceIngester];

async function ingest(params: { tx: DBTransaction; data: unknown; placeholderJobId: number }) {
  const { tx, data, placeholderJobId } = params;
  for (const Ingester of ingesters) {
    const ingestionInstance = new Ingester(placeholderJobId);
    const ingested = await ingestionInstance.tryIngest(tx, data);
    if (ingested) {
      return true;
    }
  }
  return false;
}

export async function ingestFile(filePath: string) {
  try {
    const start = DateTime.now().toJSDate();
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    let importedCount = 0;
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

      const rl = readline.createInterface({
        input: fileStream.pipe(gunzip),
        crlfDelay: Infinity, // handles \r\n and \n
      });

      for await (const line of rl) {
        if (!line) {
          continue;
        }

        if (
          await ingest({
            tx,
            placeholderJobId: placeholderJobId.id,
            data: JSON.parse(line),
          })
        ) {
          importedCount++;
        }
      }

      const end = DateTime.now().toJSDate();

      await tx
        .update(importJobsTable)
        .set({
          jobEnd: end,
          importedCount: importedCount,
          createdAt: new Date(),
        })
        .where(eq(importJobsTable.id, placeholderJobId.id));
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
}

import * as fs from "node:fs";
import readline from "node:readline";
import zlib from "node:zlib";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import { importJobsTable } from "../../models";
import { DeviceIngester } from "./DeviceIngester";
import { DeviceStatusIngester } from "./DeviceStatusIngester";
import { LocationIngester } from "./LocationIngester";

const ingesters = [LocationIngester, DeviceStatusIngester, DeviceIngester];

async function ingest(data: unknown) {
  for (const Ingester of ingesters) {
    await db.transaction(async (tx) => {
      const placeholderJobId = await tx
        .insert(importJobsTable)
        .values({
          jobStart: DateTime.now().toJSDate(),
          importedCount: 0,
          logs: [],
          createdAt: new Date(),
        })
        .returning({ id: importJobsTable.id })
        .then((r) => r[0]);

      if (!placeholderJobId.id) {
        throw new Error("Failed to insert placeholder job");
      }

      const ingestionInstance = new Ingester(placeholderJobId.id);
      await ingestionInstance.tryIngest(tx, data);
    });
  }
}

export async function ingestFile(filePath: string) {
  try {
    const fileStream = fs.createReadStream(filePath);

    const gunzip = zlib.createGunzip();

    const rl = readline.createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity, // handles \r\n and \n
    });

    for await (const line of rl) {
      if (!line) {
        continue;
      }

      await ingest(JSON.parse(line));
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}

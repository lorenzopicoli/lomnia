import "dotenv/config";
import * as fs from "node:fs";
import readline from "node:readline";
import zlib from "node:zlib";
import { EnvVar, getEnvVarOrError } from "./helpers/envVars";
import { ingestionSchemas } from "./ingestionSchemas";
import { MessageConsumer } from "./services/MessageConsumer";
import { S3 } from "./services/S3";

const main = async () => {
  const consumer = await MessageConsumer.init(getEnvVarOrError(EnvVar.INGESTER_QUEUE_NAME));
  consumer.listen(async (msg) => {
    await processMessage(msg);
    return true;
  });
};

async function processMessage(content: any) {
  try {
    console.log("Received:", JSON.stringify(content));

    const filePath = await S3.init().downloadTmp(content.bucket, content.key);

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

      const obj = JSON.parse(line);
      const location = ingestionSchemas.location.safeParse(obj);
      if (location.success && location.data) {
        console.log("Read a location", location.data);
        continue;
      }
      const device = ingestionSchemas.device.safeParse(obj);
      if (device.success && device.data) {
        console.log("Read a device", device.data);
        continue;
      }
      const deviceStatus = ingestionSchemas.deviceStatus.safeParse(obj);
      if (deviceStatus.success && deviceStatus.data) {
        console.log("Read a deviceStatus ", deviceStatus.data);
      }
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}

main();

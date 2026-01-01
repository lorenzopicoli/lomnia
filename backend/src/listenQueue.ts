import "dotenv/config";
import { EnvVar, getEnvVarOrError } from "./helpers/envVars";
import { ingestFile } from "./services/ingester";
import { Logger } from "./services/Logger";
import { MessageConsumer } from "./services/MessageConsumer";
import { S3 } from "./services/S3";

const logger = new Logger("ListenQueue");
const main = async () => {
  const consumer = await MessageConsumer.init(getEnvVarOrError(EnvVar.INGESTER_QUEUE_NAME));
  consumer.listen(async (msg: any) => {
    logger.info("Received new ingestion message:", msg);

    const filePath = await S3.init().downloadTmp(msg.bucket, msg.key);
    await ingestFile(filePath);
    return true;
  });
};

main();

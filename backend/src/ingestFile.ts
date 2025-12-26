import "dotenv/config";
import { resolve } from "node:path";
import { ingestFile } from "./services/ingester";
import { Logger } from "./services/Logger";

const logger = new Logger("IngestFile");
async function main() {
  const file = process.argv[2];

  if (!file) {
    logger.error("Usage: tsx src/scripts/ingestFile.ts <path-to-file>");
    process.exit(1);
  }

  const resolvedPath = resolve(file);
  logger.info("Ingesting file", { resolvedPath });

  await ingestFile(resolvedPath);

  logger.info("Done ingesting file", { resolvedPath });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

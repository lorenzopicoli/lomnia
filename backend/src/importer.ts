import "dotenv/config";
import { ImporterManager } from "./importers/ImporterManager";

const main = async () => {
  const importer = new ImporterManager();
  importer.schedule(10000);
  // Keep the process running
  setInterval(() => {}, 1 << 30);
};

main();

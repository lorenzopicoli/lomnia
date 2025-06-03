import "dotenv/config";
import { ImporterManager } from "./services/importers/ImporterManager";
const main = async () => {
  const importer = new ImporterManager();
  importer.schedule(5000);
  // Keep the process running
  setInterval(() => {}, 1 << 30);
};

main();

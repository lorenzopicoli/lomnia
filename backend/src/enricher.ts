import "dotenv/config";
import { EnrichmentManager } from "./services/enrichers/EnrichmentManger";

const main = async () => {
  const importer = new EnrichmentManager();
  importer.schedule(10000);
  // Keep the process running
  setInterval(() => {}, 1 << 30);
};

main();

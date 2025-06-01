import "dotenv/config";
import { exportLocationsToJSON } from "./services/exporters/dawarich";
const main = async () => {
  await exportLocationsToJSON("/home/lorenzo/projects/lomnia-out");
};

main();

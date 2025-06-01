import "dotenv/config";
import { PiholeSchemaRequestImporter } from "./services/importers/pihole";
import { ExternalLocationsImporter } from "./services/importers/locations";
import { ObsidianImporter } from "./services/importers/obsidian";
import { OpenMeteoImport } from "./services/importers/openMeteo";
import { UserPointsOfInterestImporter } from "./services/importers/userPOI";
import { NominatimImport } from "./services/importers/nominatim";
import { SamsungHealthStepCountImporter } from "./services/importers/samsungHealth/stepCount";
import { SamsungHealthHeartRateImporter } from "./services/importers/samsungHealth/heartRate";
import { SamsungHealthSleepImporter } from "./services/importers/samsungHealth/sleep";
import { SamsungHealthSleepStageImporter } from "./services/importers/samsungHealth/sleepStage";
import { SamsungHealthSnoringImporter } from "./services/importers/samsungHealth/snoring";
import { GoogleLocationsTimelineImporter } from "./services/importers/google/locationTimelineExport";
import { GoogleTakeoutLocationsImporter } from "./services/importers/google/locationTakeout";
import { OwntracksImporter } from "./services/importers/owntracks";
const importLocations = async () => {
  const locationsImporter = await new ExternalLocationsImporter();
  await locationsImporter.fetchDataForImport();
  await locationsImporter.import();
};
const importDnsQueries = async () => {
  const piholeImporter = new PiholeSchemaRequestImporter();
  await piholeImporter.fetchDataForImport();
  await piholeImporter.import();
};
const importObsidianFiles = async () => {
  const obsidianImporter = new ObsidianImporter();
  await obsidianImporter.import();
};
const importOpenMeteoData = async () => {
  const openMeteoImporter = new OpenMeteoImport();
  await openMeteoImporter.startJob();
};
const importUserPOIs = async () => {
  const userPOI = new UserPointsOfInterestImporter();
  await userPOI.startJob();
};
const nominatim = async () => {
  const nominatim = new NominatimImport();
  await nominatim.startJob();
};
const samsungData = async () => {
  const heartRate = new SamsungHealthHeartRateImporter();
  await heartRate.startJob();
  const stepCount = new SamsungHealthStepCountImporter();
  await stepCount.startJob();
  const sleep = new SamsungHealthSleepImporter();
  await sleep.startJob();
  const sleepStage = new SamsungHealthSleepStageImporter();
  await sleepStage.startJob();
  const snoring = new SamsungHealthSnoringImporter();
  await snoring.startJob();
};
const google = async () => {
  const googleLocation = new GoogleLocationsTimelineImporter();
  await googleLocation.startJob();
  const googleLocation2 = new GoogleTakeoutLocationsImporter();
  //   await googleLocation2.startJob()
};
const owntracks = async () => {
  const owntracks = new OwntracksImporter();
  await owntracks.startJob();
};
const main = async () => {
  console.log("================== LOCATIONS IMPORT ================== ");
  // await importLocations()
  console.log("================= DNS QUERIES IMPORT ================= ");
  // await importDnsQueries()
  console.log("================= OBSIDIAN IMPORT ================= ");
  // await importObsidianFiles()
  console.log("================= OWNTACKS ================= ");
  await owntracks();
  console.log("================= OPEN METEO IMPORT ================= ");
  await importOpenMeteoData();
  console.log("================= USERS POI IMPORT ================= ");
  // Should always happen before other location details imports
  await importUserPOIs();
  console.log("================= NOMINATIM IMPORT ================= ");
  await nominatim();
  console.log("================= SAMSUNG HEALTH IMPORT ================= ");
  await samsungData();
  console.log("================= GOOGLE ================= ");
  // await google()
};

main();

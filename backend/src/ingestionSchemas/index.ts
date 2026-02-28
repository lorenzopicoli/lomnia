import device from "./IngestionDevice";
import deviceStatus from "./IngestionDeviceStatus";
import habit from "./IngestionHabit";
import heartRate from "./IngestionHeartRate";
import location from "./IngestionLocation";
import sleep from "./IngestionSleep";
import sleepStage from "./IngestionSleepStage";
import website from "./IngestionWebsite";
import websiteVisit from "./IngestionWebsiteVisit";

export const ingestionSchemas = {
  location,
  device,
  deviceStatus,
  habit,
  website,
  websiteVisit,
  sleep,
  sleepStage,
  heartRate,
};

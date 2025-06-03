import { PiholeSchemaRequestImporter } from "./pihole";
import { ExternalLocationsImporter } from "./locations";
import { ObsidianImporter } from "./obsidian";
import { OpenMeteoImport } from "./openMeteo";
import { UserPointsOfInterestImporter } from "./userPOI";
import { NominatimImport } from "./nominatim";
import { SamsungHealthStepCountImporter } from "./samsungHealth/stepCount";
import { SamsungHealthHeartRateImporter } from "./samsungHealth/heartRate";
import { SamsungHealthSleepImporter } from "./samsungHealth/sleep";
import { SamsungHealthSleepStageImporter } from "./samsungHealth/sleepStage";
import { SamsungHealthSnoringImporter } from "./samsungHealth/snoring";
import { GoogleLocationsTimelineImporter } from "./google/locationTimelineExport";
import { GoogleTakeoutLocationsImporter } from "./google/locationTakeout";
import { OwntracksImporter } from "./owntracks";
import { DateTime } from "luxon";
import config from "../../config";
import { Logger } from "../Logger";

export class ImporterManager {
  private lastStart: DateTime | null = null;
  private frequencyInMs: number | null = null;
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;

  private logger = new Logger("ImportManager");

  public schedule(ms: number) {
    this.logger.info("Scheduling new import cycle", { delay: ms });
    this.frequencyInMs = ms;
    const timeSinceLastRun = this.lastStart ? Math.abs(this.lastStart.diffNow("milliseconds").milliseconds) : null;

    if (!timeSinceLastRun || timeSinceLastRun >= this.frequencyInMs) {
      this.logger.debug("Cycle lasted longer than wait time. Starting right away", { delay: ms });
      this.runOnce();
      this.clearTimeout();
    } else {
      this.logger.debug("Waiting before next import cycle", { delay: ms });
      this.clearTimeout();
      this.currentTimeout = setTimeout(this.runOnce.bind(this), this.frequencyInMs - timeSinceLastRun);
    }
  }

  public async runOnce() {
    this.lastStart = DateTime.now();
    await this.runLocationImporters();
    await this.runLocationDetailsImporters();
    await this.runHealthImporters();
    await this.internetPresenceImporters();
    await this.runFilesImporters();

    if (this.frequencyInMs) {
      this.schedule(this.frequencyInMs);
    }
  }

  public stop() {
    this.clearTimeout();
    this.frequencyInMs = null;
    this.lastStart = null;
  }

  private async runLocationImporters() {
    // Generic locations
    if (config.importers.location.generic.enabled) {
      const locationsImporter = await new ExternalLocationsImporter();
      await locationsImporter.fetchDataForImport();
      await locationsImporter.import();
    } else {
      this.logger.debug("Skipping generic locations import");
    }

    // Google takeout
    if (config.importers.location.googleTimeline.enabled) {
      const googleLocation = new GoogleLocationsTimelineImporter();
      await googleLocation.startJob();
    } else {
      this.logger.debug("Skipping google timeline import");
    }
    if (config.importers.location.googleTakout.enabled) {
      const googleLocation2 = new GoogleTakeoutLocationsImporter();
      await googleLocation2.startJob();
    } else {
      this.logger.debug("Skipping google takeout import");
    }

    // Owntracks
    if (config.importers.location.owntracksServer.enabled) {
      const owntracks = new OwntracksImporter();
      await owntracks.startJob();
    } else {
      this.logger.debug("Skipping owntracks server import");
    }
  }

  private async runLocationDetailsImporters() {
    // Nominatim
    if (config.importers.locationDetails.nominatim.enabled) {
      const nominatim = new NominatimImport();
      await nominatim.startJob();
    } else {
      this.logger.debug("Skipping Nominatim import");
    }

    // Points of interest
    if (config.importers.locationDetails.userPoi.enabled) {
      const userPOI = new UserPointsOfInterestImporter();
      await userPOI.startJob();
    } else {
      this.logger.debug("Skipping places of interest import");
    }

    // Open meteo
    if (config.importers.locationDetails.openMeteo.enabled) {
      const openMeteoImporter = new OpenMeteoImport();
      await openMeteoImporter.startJob();
    } else {
      this.logger.debug("Skipping OpenMeteo import");
    }
  }

  private async runHealthImporters() {
    // ========= Samsung =========
    // Heart rate
    if (config.importers.health.samsung.heartRate.enabled) {
      const heartRate = new SamsungHealthHeartRateImporter();
      await heartRate.startJob();
    } else {
      this.logger.debug("Skipping Samsung heart rate import");
    }
    // Step count
    if (config.importers.health.samsung.stepCount.enabled) {
      const stepCount = new SamsungHealthStepCountImporter();
      await stepCount.startJob();
    } else {
      this.logger.debug("Skipping Samsung step count import");
    }
    // Sleep
    if (config.importers.health.samsung.sleep.enabled) {
      const sleep = new SamsungHealthSleepImporter();
      await sleep.startJob();
    } else {
      this.logger.debug("Skipping Samsung sleep import");
    }
    // Sleep stages
    if (config.importers.health.samsung.sleepStage.enabled) {
      const sleepStage = new SamsungHealthSleepStageImporter();
      await sleepStage.startJob();
    } else {
      this.logger.debug("Skipping Samsung sleep stages import");
    }
    // Snoring
    if (config.importers.health.samsung.snoring.enabled) {
      const snoring = new SamsungHealthSnoringImporter();
      await snoring.startJob();
    } else {
      this.logger.debug("Skipping Samsung snoring import");
    }
  }

  private async internetPresenceImporters() {
    // Pihole
    if (config.importers.internetPresence.piholeServer.enabled) {
      const piholeImporter = new PiholeSchemaRequestImporter();
      await piholeImporter.fetchDataForImport();
      await piholeImporter.import();
    } else {
      this.logger.debug("Skipping pihole import");
    }
  }

  private async runFilesImporters() {
    // Obsidian
    if (config.importers.files.obsidian.enabled) {
      const obsidianImporter = new ObsidianImporter();
      await obsidianImporter.import();
    } else {
      this.logger.debug("Skipping Obsidian import");
    }
  }

  private clearTimeout() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }
}

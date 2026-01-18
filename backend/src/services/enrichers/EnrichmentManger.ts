import { DateTime } from "luxon";
import { Logger } from "../Logger";
import type { BaseEnricher } from "./BaseEnricher";
import { OpenMeteoEnricher } from "./openMeteo/OpenMeteoEnricher";

export class EnrichmentManager {
  private lastStart: DateTime | null = null;
  private frequencyInMs: number | null = null;
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;

  private logger = new Logger("EnrichmentManager");

  private enrichers: BaseEnricher[] = [
    // new HabitFeatureEnricher(),
    // new PlacesOfInterestEnricher(),
    new OpenMeteoEnricher(),
    // new NominatimEnricher(),
  ];

  public schedule(ms: number) {
    this.logger.info("Scheduling new enrichment cycle", { delay: ms });
    this.frequencyInMs = ms;
    const timeSinceLastRun = this.lastStart ? Math.abs(this.lastStart.diffNow("milliseconds").milliseconds) : null;

    if (!timeSinceLastRun || timeSinceLastRun >= this.frequencyInMs) {
      this.logger.debug("Cycle lasted longer than wait time. Starting right away", { delay: ms });
      this.runOnce();
      this.clearTimeout();
    } else {
      this.logger.debug("Waiting before next enrichment cycle", { delay: ms });
      this.clearTimeout();
      this.currentTimeout = setTimeout(this.runOnce.bind(this), this.frequencyInMs - timeSinceLastRun);
    }
  }

  public async runOnce() {
    this.lastStart = DateTime.now();

    for (const enricher of this.enrichers) {
      await enricher.run();
    }

    if (this.frequencyInMs) {
      this.schedule(this.frequencyInMs);
    }
  }

  public stop() {
    this.clearTimeout();
    this.frequencyInMs = null;
    this.lastStart = null;
  }

  private clearTimeout() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }
}

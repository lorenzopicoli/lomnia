import { DateTime } from "luxon";
import { delay } from "../../helpers/delay";
import { Logger } from "../Logger";
import type { BaseEnricher } from "./BaseEnricher";
import { HabitFeatureEnricher } from "./habitFeature/HabitFeatureEnricher";
import { NominatimEnricher } from "./nominatim/NominatimEnricher";
import { OpenMeteoEnricher } from "./openMeteo/OpenMeteoEnricher";
import { PlacesOfInterestEnricher } from "./placesOfInterest/PlacesOfInterestEnricher";
import { TimezoneEnricher } from "./timezone/TimezoneEnricher";

export class EnrichmentManager {
  private logger = new Logger("EnrichmentManager");

  private enrichers: BaseEnricher[] = [
    new HabitFeatureEnricher(),
    new PlacesOfInterestEnricher(),
    new OpenMeteoEnricher(),
    new NominatimEnricher(),
    new TimezoneEnricher(),
  ];

  public async schedule(ms: number) {
    while (true) {
      const start = DateTime.now();
      this.logger.info("Starting new enrichment cycle", { delay: ms });
      await this.runOnce();
      this.logger.info("Waiting before next enrichment cycle", {
        runtime: Math.abs(start.diffNow("seconds").seconds),
        delay: ms,
      });
      await delay(ms);
    }
  }

  public async runOnce() {
    for (const enricher of this.enrichers) {
      await enricher.run();
    }
  }
}

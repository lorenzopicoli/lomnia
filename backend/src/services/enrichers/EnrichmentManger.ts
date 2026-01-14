import { DateTime } from "luxon";
import { Logger } from "../Logger";
import type { BaseEnricher } from "./BaseEnricher";
import { HabitFeatureEnricher } from "./habitFeature/HabitFeatureEnricher";
import { NominatimEnricher } from "./nominatim/NominatimEnricher";
import { OpenMeteoEnricher } from "./openMeteo/OpenMeteoEnricher";
import { PlacesOfInterestEnricher } from "./placesOfInterest/PlacesOfInterestEnricher";
import { OpenMeteoEnricherOld } from "./openMeteo/OpenMeteoEnricherOld";
import { OpenMeteo } from "../openMeteo/OpenMeteo";
import { pick, zip } from "lodash";

export class EnrichmentManager {
  private lastStart: DateTime | null = null;
  private frequencyInMs: number | null = null;
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;

  private logger = new Logger("EnrichmentManager");

  private enrichers: BaseEnricher[] = [
    // new HabitFeatureEnricher(),
    // new PlacesOfInterestEnricher(),
    // new OpenMeteoEnricher(),
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

    const oldWay = new OpenMeteoEnricherOld();
    const newWay = new OpenMeteo();

    const params = {
      point: {
        lat: 45.49583622049085,
        lng: -73.57293491756394,
      },
      startDate: "2025-10-29",
      endDate: "2025-11-04",
      timezone: "America/Toronto",
    };

    console.log("Params", params);

    const oldResult = await oldWay.callApi([params.point], params.startDate, params.endDate, params.timezone);
    const newResult = await newWay.fetchHistorical(params);

    for (const daily of oldResult.daily) {
      const date = daily.date;
      const data = pick(daily, "apparentTemperatureMax");

      const newDaily = newResult?.daily.find((d) => d.day === date);
      const newData = pick(newDaily, "apparentTemperatureMax");

      console.log(`${date} -> ${data.apparentTemperatureMax} vs ${newData.apparentTemperatureMax}`);
    }
    for (const hourly of oldResult.hourly) {
      const date = hourly.date;
      const data = pick(hourly, "apparentTemperature");

      const newHourly = newResult?.hourly.find(
        (d) => d.date.toISO() === DateTime.fromJSDate(date, { zone: "UTC" }).toISO(),
      );
      const newData = pick(newHourly, "apparentTemperature");

      console.log(
        `${DateTime.fromJSDate(date, { zone: "UTC" }).toISO()} -> ${data.apparentTemperature} vs ${newData.apparentTemperature}`,
      );
    }
    if (params) {
      throw new Error("ah");
    }

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

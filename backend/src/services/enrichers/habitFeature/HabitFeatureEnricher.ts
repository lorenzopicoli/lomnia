import type { DBTransaction } from "../../../db/types";
import { HabitFeatureExtraction } from "../../habits/HabitFeatureExtraction";
import { Logger } from "../../Logger";
import { BaseEnricher } from "../BaseEnricher";

export class HabitFeatureEnricher extends BaseEnricher {
  protected logger = new Logger("HabitFeatureEnricher");

  public isEnabled(): boolean {
    return true;
  }

  public async enrich(tx: DBTransaction): Promise<void> {
    // The actual logic is in the service itself so this enricher is more of a wrapper to comply
    // with the BaseEnricher class
    await HabitFeatureExtraction.extractAndSaveHabitsFeatures(tx);
  }
}

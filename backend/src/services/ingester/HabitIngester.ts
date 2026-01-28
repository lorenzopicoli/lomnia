import { ingestionSchemas } from "../../ingestionSchemas";
import type { IngestionHabit } from "../../ingestionSchemas/IngestionHabit";
import { habitsTable, type NewHabit } from "../../models";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class HabitIngester extends Ingester<IngestionHabit, NewHabit> {
  protected logger = new Logger("HabitIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionHabit;
  } {
    const habit = ingestionSchemas.habit.safeParse(raw);
    return {
      isIngestable: habit.success,
      parsed: habit.data,
    };
  }

  transform(raw: IngestionHabit): NewHabit {
    const transformed: NewHabit = {
      externalId: raw.id,

      key: raw.key,
      value: raw.value,
      date: new Date(raw.date),

      source: raw.source,
      timezone: raw.timezone,
      comments: raw.comments,
      recordedAt: new Date(raw.recordedAt),

      periodOfDay: raw.periodOfDay,
      isFullDay: raw.isFullDay,

      importJobId: this.importJobId,
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    await this.tx.insert(habitsTable).values(this.collected);
  }
}

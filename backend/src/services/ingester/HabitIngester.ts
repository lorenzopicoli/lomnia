import { type SQL, sql } from "drizzle-orm";
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
      valuePrefix: raw.valuePrefix,
      valueSuffix: raw.valueSuffix,
      recordedAt: new Date(raw.recordedAt),

      periodOfDay: raw.periodOfDay,
      isFullDay: raw.isFullDay,

      importJobId: this.importJobId,
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    // Setting it like this to force new properties to be considered for update on conflict.
    const updateOnConflict: Omit<{ [key in keyof NewHabit]: SQL }, "importJobId"> = {
      key: sql`excluded.key`,
      value: sql`excluded.value`,
      date: sql`excluded.date`,

      source: sql`excluded.source`,
      valuePrefix: sql`excluded.value_prefix`,
      valueSuffix: sql`excluded.value_suffix`,
      timezone: sql`excluded.timezone`,
      comments: sql`excluded.comments`,
      recordedAt: sql`excluded.recorded_at`,

      periodOfDay: sql`excluded.period_of_day`,
      isFullDay: sql`excluded.is_full_day`,
    };
    await this.tx.insert(habitsTable).values(this.collected).onConflictDoUpdate({
      target: habitsTable.externalId,
      set: updateOnConflict,
    });
  }
}

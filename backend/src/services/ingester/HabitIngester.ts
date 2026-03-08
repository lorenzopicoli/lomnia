import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type { IngestionHabit } from "../../ingestionSchemas/IngestionHabit";
import { habitsTable, type NewHabit } from "../../models";
import type { Exhaustive } from "../../types/exhaustive";
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
    const {
      id,
      key,
      value,
      date,
      source,
      timezone,
      comments,
      valuePrefix,
      valueSuffix,
      recordedAt,
      periodOfDay,
      isFullDay,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewHabit = {
      externalId: id,

      key,
      value,
      date: new Date(date),

      source,
      timezone,
      comments,
      valuePrefix,
      valueSuffix,
      recordedAt: new Date(recordedAt),

      periodOfDay,
      isFullDay,

      importJobId: this.importJobId,
      createdAt: new Date(),
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(habitsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(habitsTable).values(this.collected).onConflictDoUpdate({
      target: habitsTable.externalId,
      set: updateOnConflict,
    });
  }
}

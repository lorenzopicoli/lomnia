import { eq, inArray } from "drizzle-orm";
import { DateTime } from "luxon";
import z from "zod";
import type { DBTransaction } from "../../db/types";
import { EnvVar, getEnvVarOrError } from "../../helpers/envVars";
import { habitsTable, type NewHabit } from "../../models";
import { extractedHabitFeaturesTable } from "../../models/HabitFeature";
import { BaseImporter } from "../BaseImporter";

export const JSONFileFormatSchema = z.array(
  z
    .object({
      date: z.string(),
      recordedAt: z.string(),
      key: z.string(),
      value: z.unknown(),
      source: z.string(),
      timezone: z.string(),
      isFullDay: z.boolean(),
    })
    .strict(),
);

export type JSONFileFormat = z.infer<typeof JSONFileFormatSchema>;
export class ObsidianHabitsJSONImporter extends BaseImporter {
  override sourceId = "obsidian-json";
  override destinationTable = "habits";
  override entryDateKey = "date";

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    return { result: true };
  }

  public async import(params: { tx: DBTransaction; placeholderJobId: number }): Promise<{
    importedCount: number;
    firstEntryDate: Date;
    lastEntryDate: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    let importedCount = 0;
    const { tx, placeholderJobId } = params;
    const rawFile = require(getEnvVarOrError(EnvVar.OBSIDIAN_HABITS_SNAPSHOT_FILE_PATH));
    const file = JSONFileFormatSchema.parse(rawFile);

    await this.deleteExistingData(tx);
    for (const entry of file) {
      const date = DateTime.fromISO(entry.date).toJSDate();
      const recordedAt = DateTime.fromISO(entry.recordedAt).toJSDate();
      const habit: NewHabit = {
        date,
        source: this.sourceId,
        importJobId: placeholderJobId,
        key: entry.key,
        timezone: entry.timezone,
        value: entry.value,
        recordedAt,
        isFullDay: entry.isFullDay,
        createdAt: new Date(),
      };
      await tx.insert(habitsTable).values(habit);
      await this.updateFirstAndLastEntry(date);
      importedCount++;
    }
    return {
      importedCount,
      firstEntryDate: this.firstEntry ?? new Date(),
      lastEntryDate: this.lastEntry ?? new Date(),
      logs: [],
    };
  }

  /**
   * Delete all existing data since there are no incremental imports right now for this importer
   */
  private async deleteExistingData(tx: DBTransaction) {
    await tx
      .delete(extractedHabitFeaturesTable)
      .where(
        inArray(
          extractedHabitFeaturesTable.habitId,
          tx.select({ id: habitsTable.id }).from(habitsTable).where(eq(habitsTable.source, this.sourceId)),
        ),
      );

    await tx.delete(habitsTable).where(eq(habitsTable.source, this.sourceId));
  }
}

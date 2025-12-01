import { eq, inArray } from "drizzle-orm";
import { DateTime } from "luxon";
import { z } from "zod";
import type { DBTransaction } from "../../db/types";
import { EnvVar, getEnvVarOrError } from "../../helpers/envVars";
import { habitsTable, type NewHabit } from "../../models";
import { extractedHabitFeaturesTable } from "../../models/HabitFeature";
import { BaseImporter } from "../BaseImporter";

export const TrackersTableSchema = z.object({
  id: z.number(),
  name: z.string(),
  deletedAt: z.string().nullable(),
});

export const EntriesTableSchema = z
  .object({
    id: z.number(),
    trackerId: z.number(),
    comment: z.string().nullable(),
    date: z.string(),
    periodOfDay: z.enum(["morning", "afternoon", "evening"]).nullable(),
    timezone: z.string(),
    createdAt: z.string(),
    numberValue: z.number().nullable(),
    booleanValue: z.boolean().nullable(),
  })
  .strict();

export const TextListEntriesTableSchema = z
  .object({
    id: z.number(),
    trackerId: z.number(),
    entryId: z.number(),
    name: z.string(),
  })
  .strict();

export const FullSchema = z.object({
  trackersTable: z.array(TrackersTableSchema),
  entriesTable: z.array(EntriesTableSchema),
  textListEntriesTable: z.array(TextListEntriesTableSchema),
});

export type FullSchemaType = z.infer<typeof FullSchema>;

export class HaresJSONImporter extends BaseImporter {
  override sourceId = "hares-json";
  override destinationTable = "habits";
  override entryDateKey = "date/periodOfDay";

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
    const rawFile = require(getEnvVarOrError(EnvVar.HARES_JSON_FILE_PATH));
    const file = FullSchema.parse(rawFile);

    const trackersById = file.trackersTable.reduce(
      (acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      },
      {} as Record<string, (typeof file)["trackersTable"][number]>,
    );

    await this.deleteExistingData(tx);
    for (const entry of file.entriesTable) {
      let value: number | boolean | string[] | null = entry.numberValue ?? entry.booleanValue ?? null;
      if (value === null || value === undefined) {
        const text = file.textListEntriesTable.filter((e) => e.entryId === entry.id).map((e) => e.name);
        if (text.length > 0) {
          value = text;
        }
      }

      const date = DateTime.fromISO(entry.date).toJSDate();
      const habit: NewHabit = {
        date,
        source: this.sourceId,
        importJobId: placeholderJobId,
        key: trackersById[entry.trackerId].name,
        timezone: entry.timezone,
        // Default to true because some just track the action, but that should be the equivalent of true
        value: value ?? true,
        comments: entry.comment,
        recordedAt: DateTime.fromISO(entry.createdAt).toJSDate(),
        periodOfDay: entry.periodOfDay,
        isFullDay: false,
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

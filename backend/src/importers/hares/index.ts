import { DateTime } from "luxon";
import type { DBTransaction } from "../../db/types";
import { habitsTable, type NewHabit } from "../../models";
import { BaseImporter } from "../BaseImporter";

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
    const file: {
      trackersTable: {
        id: number;
        name: string;
        deletedAt: string | null;
      }[];
      entriesTable: {
        id: number;
        trackerId: number;
        comment: string | null;
        date: string;
        periodOfDay: string | null;
        timezone: string;
        createdAt: string;
        numberValue: number | null;
        booleanValue: boolean | null;
      }[];
      textListEntriesTable: {
        id: number;
        trackerId: number;
        entryId: number;
        name: string;
      }[];
    } = require("/home/lorenzo/Downloads/Telegram Desktop/hares_data (14).json");

    const trackersById = file.trackersTable.reduce(
      (acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      },
      {} as Record<string, (typeof file)["trackersTable"][number]>,
    );

    for (const entry of file.entriesTable) {
      let value: any = entry.numberValue ?? entry.booleanValue;
      if (value === null || value === undefined) {
        const text = file.textListEntriesTable.filter((e) => e.entryId === entry.id).map((e) => e.name);
        if (text.length > 0) {
          value = text;
        }
      }
      const date = DateTime.fromISO(entry.date).toJSDate();
      const habit: NewHabit = {
        date,
        source: "hares",
        importJobId: placeholderJobId,
        key: trackersById[entry.trackerId].name,
        timezone: entry.timezone,
        // Default to true because some just track the action, but that should be the equivalent of true
        value: value ?? true,
        comments: entry.comment,
        recordedAt: DateTime.fromISO(entry.createdAt).toJSDate(),
        // TODO fix this
        periodOfDay: entry.periodOfDay as any,
        isFullDay: false,
      };
      await tx
        .insert(habitsTable)
        .values(habit)
        .catch((e) => {
          console.log("EEE", e);
          throw e;
        });
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
}

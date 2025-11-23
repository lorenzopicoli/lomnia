import { isValid, parse } from "date-fns";
import { count, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { filesTable } from "../models";
import { anonymize } from "./anonymize";

export namespace DiaryEntriesService {
  function removeUnwantedContent(markdownText: string): string {
    // Remove everything after ## Birthdays. That's where I keep some dataview blocks in my
    // personal notes
    return markdownText.replace("Diary & notes", "").split("## Birthdays")[0];
  }

  export async function getByDay(params: { day: string; privateMode: boolean }) {
    const { day, privateMode } = params;
    if (!isValid(parse(day, "yyyy-MM-dd", new Date()))) {
      throw new Error("Invalid date");
    }
    const entry = await db.query.filesTable.findFirst({
      columns: {
        id: true,
        content: true,
        tags: true,
        relativePath: true,
        source: true,
      },
      where: sql`'diary/personal' = ANY(tags) AND (metadata->>'date')::date = ${day}`,
    });

    if (!entry) {
      return;
    }

    const cleanContent = removeUnwantedContent(entry.content ?? "");

    const content = privateMode ? anonymize(cleanContent) : cleanContent;

    return {
      ...entry,
      content,
    };
  }

  export async function getCount() {
    return db
      .select({
        count: count(),
      })
      .from(filesTable)
      .then((r) => r[0].count);
  }
}

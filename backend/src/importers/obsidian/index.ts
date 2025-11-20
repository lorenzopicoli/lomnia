import crypto from "node:crypto";
import * as fsSync from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { isAfter, isBefore, isValid, parseISO } from "date-fns";
import { eq, sql } from "drizzle-orm";
import fm from "front-matter";
import { glob } from "glob";
import { DateTime } from "luxon";
import { db } from "../../db/connection";
import type { DBTransaction } from "../../db/types";
import { EnvVar, getEnvVarOrError } from "../../helpers/envVars";
import { getKeys } from "../../helpers/getKeys";
import { filesTable } from "../../models/File";
import { habitsTable, type NewHabit } from "../../models/Habit";
import { type ImportJob, importJobsTable } from "../../models/ImportJob";
import {
  diaryEntryValidation,
  HabitKeys,
  knownObsidianMetadataKeyToEnumMap,
  type ObsidianFileMetadata,
  type ObsidianMetadataKey,
  obsidianMetadataValidationSchema,
} from "./personal";

export class ObsidianImporter {
  private obsidianFolderPath: string;
  private sourceId = "obsidian-v1";
  private destinationTable = "files/habits";
  private entryDateKey = "frontmatter.date";
  private jobStart = new Date();
  private placeholderDate = new Date(1997, 6, 6);

  constructor() {
    this.obsidianFolderPath = getEnvVarOrError(EnvVar.OBSIDIAN_FOLDER);
  }

  private getChecksumFromData(data: string) {
    return crypto.createHash("md5").update(data).digest("hex");
  }

  private async getFilePaths() {
    const globPattern = path.join(this.obsidianFolderPath, "**/*.md");

    const ignoreFolders = getEnvVarOrError(EnvVar.OBSIDIAN_IGNORE_FOLDERS);
    const foldersToIgnore = (ignoreFolders ?? "").split(",");
    const mdFiles = await glob(globPattern, {
      ignore: {
        childrenIgnored: (p) => p.isNamed("git") || foldersToIgnore.some((f) => p.isNamed(f)),
      },
      withFileTypes: false,
    });

    return mdFiles;
  }

  private mapFileMetadata(attributes: unknown): ObsidianFileMetadata | null {
    const typedAttributes = attributes as Record<string, unknown>;
    const mappedMetadata: { [key in ObsidianMetadataKey]?: unknown } = {};
    for (const key of getKeys(typedAttributes)) {
      const mapped: ObsidianMetadataKey | undefined = knownObsidianMetadataKeyToEnumMap[key.toLowerCase()];

      if (!mapped) {
        console.log("New metadata?", key);
        continue;
      }

      if (typedAttributes[key] === null) {
        continue;
      }

      let value = typedAttributes[key];

      if (value instanceof Date) {
        value = value.toISOString();
      } else if (typeof value === "string" && isValid(parseISO(value))) {
        value = parseISO(value).toISOString();
      }
      mappedMetadata[mapped] = value;
    }

    const typedMetadata = obsidianMetadataValidationSchema.safeParse(mappedMetadata);

    if (typedMetadata.error || !typedMetadata) {
      console.log("Zod error, please fix before proceeding", typedMetadata.error);
      return null;
    }

    return typedMetadata.data;
  }

  private async processFile(filePath: string, rawContent: string) {
    const rawMetadata = fm(rawContent);
    const checksum = this.getChecksumFromData(rawContent);
    const front = rawMetadata.attributes as {
      tags: string[];
      created_at: Date;
      updated_at: Date;
    };
    const metadata = await this.mapFileMetadata(front);
    if (!metadata) {
      throw Error(`Failed to process file ${filePath}`);
    }

    return {
      tags: metadata.tags,
      metadata: metadata,
      checksum,
      contentType: "markdown" as const,
      content: rawMetadata.body,
      fileCreatedAt: front.created_at,
      fileUpdatedAt: front.updated_at,
      relativePath: filePath.replace(this.obsidianFolderPath, ""),
      source: "obsidian" as const,
    };
  }

  public async importInternal(params: { tx: DBTransaction }) {
    const { tx } = params;
    const logs: string[] = [];
    let firstEntryDate: ImportJob["firstEntryDate"] | undefined;
    let lastEntryDate: ImportJob["lastEntryDate"] | undefined;
    let importedCount = 0;

    const updateEntryDates = (date: Date) => {
      if (!lastEntryDate || isAfter(date, lastEntryDate)) {
        lastEntryDate = date;
      }
      if (!firstEntryDate || isBefore(date, firstEntryDate)) {
        firstEntryDate = date;
      }
    };

    const placeholderJob = await tx
      .insert(importJobsTable)
      .values({
        source: this.sourceId,
        destinationTable: this.destinationTable,
        entryDateKey: this.entryDateKey,

        jobStart: this.jobStart,
        jobEnd: this.placeholderDate,
        firstEntryDate: this.placeholderDate,
        lastEntryDate: this.placeholderDate,

        importedCount: 0,
        logs: [],
        createdAt: new Date(),
      })
      .returning({ id: importJobsTable.id })
      .then((r) => r[0]);

    // Reset tables
    await tx.delete(habitsTable).where(sql`file_id IN (SELECT id FROM files WHERE source='obsidian')`);
    await tx.delete(filesTable).where(eq(filesTable.source, "obsidian"));

    const mdFiles = await this.getFilePaths();
    for (const filePath of mdFiles) {
      const rawContent = await fs.readFile(filePath, "utf8");
      if (filePath.indexOf("sync-conflict") > -1) {
        logs.push("Found sync conflict file");
        continue;
      }
      const file = await this.processFile(filePath, rawContent);

      const dbFile = await tx
        .insert(filesTable)
        .values({
          ...file,
          importJobId: placeholderJob.id,
          createdAt: new Date(),
        })
        .returning({ id: filesTable.id })
        .then((r) => r[0]);

      importedCount++;
      updateEntryDates(file.fileCreatedAt);
      const isDiary = file.tags.includes("diary/personal");

      if (filePath.indexOf("02-Diary") > -1 && !file.tags.some((t) => t.indexOf("diary/") > -1)) {
        console.log("Detected file inside diary folder not tagged with diary tag", filePath, file.metadata.tags);
      }

      if (!isDiary) {
        continue;
      }

      const validation = diaryEntryValidation(file.metadata, filePath);

      if (validation.validationMessage) {
        // TODO: send on telegram
        console.log(validation.validationMessage);
        logs.push(`Validation error at file "${filePath}": ${validation.validationMessage}`);
      }

      if (!validation.isValid) {
        continue;
      }
      const habitsForFile: NewHabit[] = [];
      for (const key of getKeys(file.metadata)) {
        const habitKeys = Object.values(HabitKeys) as string[];

        if (habitKeys.includes(key)) {
          // Cases where date is null should already be covered in the validation above
          // The yaml reader formats the date in UTC, use setZone to force timezone to be UTC
          // which will avoid conversions. Since we save in date format (not timestamp) we
          // don't care about the timezone as long as the date is fine
          const date = DateTime.fromISO(file.metadata.date as string, {
            setZone: true,
          });

          importedCount++;
          updateEntryDates(file.fileCreatedAt);

          habitsForFile.push({
            createdAt: new Date(),
            fileId: dbFile.id,
            importJobId: placeholderJob.id,
            date: date.toSQLDate() as string,
            key,
            value: file.metadata[key],
          });
        }
      }

      if (habitsForFile.length > 0) {
        await tx.insert(habitsTable).values(habitsForFile);
      }
    }

    if (importedCount === 0) {
      return tx.rollback();
    }

    await tx
      .update(importJobsTable)
      .set({
        jobEnd: new Date(),
        firstEntryDate,
        lastEntryDate,

        importedCount,
        logs: [],
        createdAt: new Date(),
      })
      .where(eq(importJobsTable.id, placeholderJob.id));
  }

  public async import() {
    console.log("Importing data for obsidian files");

    await db
      .transaction(async (tx) => {
        await this.importInternal({ tx });
      })
      .catch((e) => console.log("NOTHING E", e));
  }
}

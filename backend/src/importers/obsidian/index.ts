import crypto from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import { isValid, parseISO } from "date-fns";
import { eq } from "drizzle-orm";
import fm from "front-matter";
import { glob } from "glob";
import { z } from "zod";
import { db } from "../../db/connection";
import type { DBTransaction } from "../../db/types";
import { EnvVar, getEnvVarOrError } from "../../helpers/envVars";
import { getKeys } from "../../helpers/getKeys";
import { filesTable } from "../../models/File";
import { importJobsTable } from "../../models/ImportJob";

enum ObsidianMetadata {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
  Tags = "tags",
  Aliases = "aliases",
  Date = "date",
  Authors = "authors",
}

const obsdianMetadataKeys = ["created_at", "updated_at", "tags", "aliases", "Date", "authors"] as const;
type ObsidianMetadataKey = (typeof obsdianMetadataKeys)[number];

const knownObsidianMetadataKeyToEnumMap: Record<Lowercase<ObsidianMetadataKey>, ObsidianMetadata> = {
  authors: ObsidianMetadata.Authors,
  date: ObsidianMetadata.Date,
  created_at: ObsidianMetadata.CreatedAt,
  updated_at: ObsidianMetadata.UpdatedAt,
  tags: ObsidianMetadata.Tags,
  aliases: ObsidianMetadata.Aliases,
};

const obsidianMetadataValidationSchema = z
  .object({
    [ObsidianMetadata.CreatedAt]: z.iso.datetime(),
    [ObsidianMetadata.UpdatedAt]: z.iso.datetime(),
    [ObsidianMetadata.Tags]: z.array(z.string()).default([]),
    [ObsidianMetadata.Aliases]: z.array(z.string()),
    [ObsidianMetadata.Date]: z.iso.datetime(),
    [ObsidianMetadata.Authors]: z.array(z.string()),
  })
  .partial()
  .required({
    [ObsidianMetadata.Tags]: true,
  });

type ObsidianFileMetadata = z.infer<typeof obsidianMetadataValidationSchema>;

/**
 * TODO: Use base importer as base class
 */
export class ObsidianImporter {
  private obsidianFolderPath: string;
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
    const mappedMetadata: Record<string, unknown> = {};
    for (const key of getKeys(typedAttributes)) {
      // assume the right type and check it against the dictionary
      const typedKey = key.toLowerCase() as Lowercase<ObsidianMetadataKey>;
      const mapped = knownObsidianMetadataKeyToEnumMap[typedKey];

      if (!mapped) {
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
      console.log("", typedMetadata.error);
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
    let importedCount = 0;

    const placeholderJob = await tx
      .insert(importJobsTable)
      .values({
        jobStart: this.jobStart,
        jobEnd: this.placeholderDate,

        importedCount: 0,
        logs: [],
        createdAt: new Date(),
      })
      .returning({ id: importJobsTable.id })
      .then((r) => r[0]);

    // Reset tables
    await tx.delete(filesTable).where(eq(filesTable.source, "obsidian"));

    const mdFiles = await this.getFilePaths();
    for (const filePath of mdFiles) {
      const rawContent = await fs.readFile(filePath, "utf8");
      if (filePath.indexOf("sync-conflict") > -1) {
        logs.push("Found sync conflict file");
        continue;
      }
      const file = await this.processFile(filePath, rawContent);

      await tx
        .insert(filesTable)
        .values({
          ...file,
          importJobId: placeholderJob.id,
          createdAt: new Date(),
        })
        .returning({ id: filesTable.id })
        .then((r) => r[0]);

      importedCount++;
      const isDiary = file.tags.includes("diary/personal");

      if (!isDiary) {
      }
    }

    if (importedCount === 0) {
      return tx.rollback();
    }

    await tx
      .update(importJobsTable)
      .set({
        jobEnd: new Date(),

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

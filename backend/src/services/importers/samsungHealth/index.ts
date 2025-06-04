import type { DBTransaction } from "../../../db/types";
import { BaseImporter } from "../BaseImporter";
import { parse } from "csv-parse";
import * as fs from "node:fs";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { isNotNill } from "../../../helpers/isNotNil";
import { EnvVar, getEnvVarOrError } from "../../../helpers/envVars";
import type { DateTime } from "luxon";

export class BaseSamsungHealthImporter<T> extends BaseImporter {
  private identifier: string;

  private baseExportPath: string;
  public csvPath: string;

  private onNewBinnedData: (row: unknown, data: unknown, importJobId: number) => Promise<T | null>;
  private onNewRow: (data: unknown, importJobId: number) => Promise<T | null>;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private recordsTable: PgTableWithColumns<any>;

  private binnedDataColumn?: string;

  public logs: string[] = [];

  constructor(params: {
    onNewBinnedData: (csvRow: unknown, binnedData: unknown, importJobId: number) => Promise<T | null>;
    onNewRow: (data: unknown, importJobId: number) => Promise<T | null>;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    recordsTable: PgTableWithColumns<any>;
    identifier: string;
    binnedDataColumn?: string;
  }) {
    super();
    this.onNewBinnedData = params.onNewBinnedData;
    this.onNewRow = params.onNewRow;
    this.recordsTable = params.recordsTable;
    this.identifier = params.identifier;
    this.binnedDataColumn = params.binnedDataColumn;

    // Regex to match any folder name ending with the date-time part
    const folderRegex = /_(\d{14})$/;
    const healthFolder = getEnvVarOrError(EnvVar.SAMSUNG_HEALTH_FOLDER);
    const folders = fs
      .readdirSync(healthFolder)
      .filter((folder) => folderRegex.test(folder))
      .map((folder) => {
        const match = folder.match(folderRegex);
        if (match) {
          return {
            name: folder,
            date: match[1],
          };
        }
        return null;
      })
      .filter((item) => item !== null) as { name: string; date: string }[];

    if (folders.length === 0) {
      throw new Error("No Samsung Health export folders found");
    }
    folders.sort((a, b) => b.date.localeCompare(a.date));

    this.baseExportPath = `${healthFolder}/${folders[0].name}`;
    this.csvPath = `${this.baseExportPath}/${this.identifier}.${folders[0].date}.csv`;
  }

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    return { result: true };
  }

  override async import(params: {
    tx: DBTransaction;
    placeholderJobId: number;
  }): Promise<{
    importedCount: number;
    firstEntryDate?: Date;
    lastEntryDate?: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    let importedCount = 0;
    const batchSize = 100;
    let entriesToSave: T[] = [];

    for await (const record of this.readCsvFile()) {
      const binnedData =
        this.binnedDataColumn && record[this.binnedDataColumn]
          ? this.getBinnedData(record[this.binnedDataColumn])
          : undefined;
      const newEntriesProm: Promise<T | null>[] = binnedData?.map((d: unknown) =>
        this.onNewBinnedData(record, d, params.placeholderJobId),
      ) ?? [this.onNewRow(record, params.placeholderJobId)];

      const newEntries = await Promise.all(newEntriesProm);
      entriesToSave = entriesToSave.concat(newEntries.filter(isNotNill));

      if (entriesToSave.length >= batchSize) {
        await params.tx.insert(this.recordsTable).values(entriesToSave);
        importedCount += entriesToSave.length;
        entriesToSave = [];
      }
    }

    if (entriesToSave.length > 0) {
      await params.tx.insert(this.recordsTable).values(entriesToSave);
    }
    importedCount += entriesToSave.length;
    entriesToSave = [];
    return {
      importedCount,
      apiCallsCount: 0,
      logs: this.logs,
    };
  }

  private readCsvFile() {
    return fs.createReadStream(this.csvPath).pipe(
      parse({
        columns: true,
        relaxColumnCount: true,
        fromLine: 2,
        skipEmptyLines: true,
        cast: true,
        castDate: false,
      }),
    );
  }

  private getBinnedData(binFileName: string) {
    const fullPath = `${this.baseExportPath}/jsons/${this.identifier}/${binFileName.charAt(0)}/${binFileName}`;

    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  }
}

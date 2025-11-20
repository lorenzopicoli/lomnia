import Database from "better-sqlite3";
import { asc, desc, eq, getTableName, gt, sql } from "drizzle-orm";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import type { SQLiteSelectQueryBuilder } from "drizzle-orm/sqlite-core";
import { find } from "geo-tz";
import { db } from "../../db/connection";
import type { DBTransaction } from "../../db/types";
import { MissingFieldError, UnexpectedValueError } from "../../errors";
import { EnvVar, getEnvVarOrError } from "../../helpers/envVars";
import ProgressLogger from "../../helpers/ProgressLogger";
import { type ImportJob, importJobsTable } from "../../models/ImportJob";
import { locationsTable, type NewLocation } from "../../models/Location";
import { newSSHConnection, safeDownloadFile } from "../ssh";
import externalLocationSchema from "./schema/externalLocationSchema";
import { type ExternalLocation, externalLocationsTable } from "./schema/tables";

export class ExternalLocationsImporter {
  private importDb: BetterSQLite3Database<typeof externalLocationSchema>;
  private sourceId = "sqlite-locations_events-v1";
  private destinationTable = getTableName(locationsTable);
  private entryDateKey = "timestamp" as const;
  private importBatchSize = 3000;
  private placeholderDate = new Date(1997, 6, 6);
  private localPath: string;
  private fileName = "locations.db";

  private jobStart = new Date();

  constructor() {
    const backupFolder = getEnvVarOrError(EnvVar.LOCATIONS_LOCAL_BACKUP_FOLDER);
    this.localPath = `${backupFolder}/${this.fileName}`;
    const sqlite = new Database(this.localPath);
    this.importDb = drizzle(sqlite, {
      logger: false,
      schema: externalLocationSchema,
    });
  }

  private withFilters<T extends SQLiteSelectQueryBuilder>(qb: T, startDate?: Date) {
    return qb
      .where(startDate ? gt(externalLocationsTable[this.entryDateKey], startDate) : undefined)
      .orderBy(asc(externalLocationsTable[this.entryDateKey]));
  }

  private fetchFromSource(offset: number, startDate?: Date) {
    const query = this.importDb.select().from(externalLocationsTable);

    return this.withFilters(query.$dynamic(), startDate)
      .orderBy(asc(externalLocationsTable[this.entryDateKey]))
      .limit(this.importBatchSize)
      .offset(offset);
  }

  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: Date;
    totalEstimate: number;
  }> {
    const lastJob = await db.query.importJobsTable.findFirst({
      where: eq(importJobsTable.source, this.sourceId),
      orderBy: desc(importJobsTable.lastEntryDate),
    });

    const startDate = lastJob?.lastEntryDate;

    const countQuery = this.importDb.select({ count: sql`count(*)`.mapWith(Number) }).from(externalLocationsTable);

    const count = await this.withFilters(countQuery.$dynamic(), startDate).then((r) => r[0]?.count);

    return {
      totalEstimate: count,
      result: count > 0,
      from: startDate,
    };
  }

  private async importInternal(params: { tx: DBTransaction; from?: Date; totalEstimate: number }) {
    const { tx, from, totalEstimate } = params;
    let firstEntryDate: ImportJob["firstEntryDate"] | undefined;
    let lastEntryDate: ImportJob["lastEntryDate"] | undefined;
    let importedCount = 0;
    let currentOffset = 0;
    let events: ExternalLocation[] | undefined;

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

    if (!placeholderJob.id) {
      throw new Error("Failed to insert placeholder job");
    }

    const progressLogger = new ProgressLogger("Locations import", {
      total: totalEstimate,
    });
    while (events?.length !== 0) {
      events = await this.fetchFromSource(currentOffset, from);
      currentOffset += this.importBatchSize;
      if (events.length > 0) {
        await tx.insert(locationsTable).values(events.map((e) => this.mapData(placeholderJob.id, e)));

        const firstEntry: ExternalLocation | undefined = events[0];
        const lastEntry: ExternalLocation | undefined = events[events.length - 1];

        if (!firstEntryDate && firstEntry[this.entryDateKey]) {
          firstEntryDate = firstEntry[this.entryDateKey] ?? undefined;
        }
        if (lastEntry?.[this.entryDateKey]) {
          lastEntryDate = lastEntry[this.entryDateKey] ?? undefined;
        }

        importedCount += events.length;
        progressLogger.step(importedCount, totalEstimate);
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

  public async fetchDataForImport() {
    const host = getEnvVarOrError(EnvVar.LOCATIONS_HOST);
    const remoteDbPath = getEnvVarOrError(EnvVar.LOCATIONS_REMOTE_DB_PATH);
    const remoteBackupFolder = getEnvVarOrError(EnvVar.LOCATIONS_REMOTE_BACKUP_FOLDER);
    const sshConnection = await newSSHConnection(host);
    await safeDownloadFile({
      sshConnection,
      localPath: this.localPath,
      remotePath: remoteDbPath,
      remoteCopyPath: `${remoteBackupFolder}/${this.fileName}`,
    });
    sshConnection.dispose();
  }

  public async import() {
    const { result, from, totalEstimate } = await this.sourceHasNewData();
    console.log("Importing data for locations");
    if (!result) {
      console.log("No new data found");
      return;
    }

    await db
      .transaction(async (tx) => {
        await this.importInternal({ tx, from, totalEstimate });
      })
      .catch((e) => console.log("NOTHING E", e));
  }

  public mapData(jobId: number, importerData: ExternalLocation): NewLocation {
    if (!importerData.id) {
      throw new MissingFieldError("id");
    }
    if (importerData.batteryStatus === undefined || importerData.batteryStatus === null) {
      throw new MissingFieldError("batteryStatus");
    }
    if (!importerData.latitude) {
      throw new MissingFieldError("latitude");
    }
    if (!importerData.longitude) {
      throw new MissingFieldError("longitude");
    }

    /**
     *
     * w phone is connected to a WiFi connection (iOS,Android)
     * o phone is offline (iOS,Android)
     * m mobile data (iOS,Android)
     * https://owntracks.org/booklet/tech/json/
     */
    const connectionMap: Record<NonNullable<ExternalLocation["connectionStatus"]>, NewLocation["connectionStatus"]> = {
      w: "wifi",
      o: "offline",
      m: "data",
    };
    const connectionStatus = importerData.connectionStatus
      ? (connectionMap[importerData.connectionStatus] ?? null)
      : null;

    /**
     * Battery Status 0=unknown, 1=unplugged, 2=charging, 3=full
     * https://owntracks.org/booklet/tech/json/
     */
    const batteryMap: Record<NonNullable<ExternalLocation["batteryStatus"]>, NewLocation["batteryStatus"]> = {
      0: "unknown",
      1: "unplugged",
      2: "charging",
      3: "full",
    };
    const batteryStatus = batteryMap[importerData.batteryStatus] ?? null;

    if (!batteryStatus) {
      throw new UnexpectedValueError(`batteryStatus = ${importerData.batteryStatus}`);
    }

    /**
     * p ping issued randomly by background task (iOS,Android)
     * c circular region enter/leave event (iOS,Android)
     * b beacon region enter/leave event (iOS)
     * r response to a reportLocation cmd message (iOS,Android)
     * u manual publish requested by the user (iOS,Android)
     * t timer based publish in move move (iOS)
     * v updated by Settings/Privacy/Locations Services/System Services/Frequent Locations monitoring (iOS)
     */
    const triggerMap: Record<NonNullable<ExternalLocation["triggerType"]>, NewLocation["trigger"]> = {
      p: "ping",
      c: "circular",
      u: "manual",
      r: "report_location",
    };
    const trigger = importerData.triggerType ? (triggerMap[importerData.triggerType] ?? null) : null;

    const timezone = find(importerData.latitude, importerData.longitude)[0] || null;

    if (!timezone) {
      throw new Error(`Failed to find timezone for ${JSON.stringify(importerData)}`);
    }

    return {
      externalId: importerData.id,
      accuracy: importerData.accuracy,
      verticalAccuracy: importerData.verticalAccuracy,
      velocity: importerData.velocity,
      altitude: importerData.altitude,
      battery: importerData.battery,
      batteryStatus,
      connectionStatus,
      location: { lat: importerData.latitude, lng: importerData.longitude },

      source: "sqlite_locations",

      trigger,

      topic: importerData.originalPublishTopic,
      wifiSSID: importerData.wifiSSID,
      rawData: importerData,

      importJobId: jobId,

      messageCreatedAt: importerData.messageCreationTime,
      locationFix: importerData[this.entryDateKey],

      timezone,

      createdAt: new Date(),
    };
  }
}

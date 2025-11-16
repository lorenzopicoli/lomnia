import axios from "axios";
import { desc, eq } from "drizzle-orm";
import { chunk } from "lodash";
import { DateTime } from "luxon";
import config from "../../../config";
import { db } from "../../../db/connection";
import type { DBTransaction } from "../../../db/types";
import { delay } from "../../../helpers/delay";
import { EnvVar, getEnvVarOrError } from "../../../helpers/envVars";
import {
  type batteryStatusEnum,
  type connectionStatusEnum,
  importJobsTable,
  locationsTable,
  type locationTriggerEnum,
  type NewLocation,
} from "../../../models";
import { BaseImporter } from "../BaseImporter";
import { type OwntracksLocation, OwntracksLocationApiResponseSchema } from "./schema";

export class OwntracksImporter extends BaseImporter {
  override sourceId = "owntracks-api";
  override destinationTable = "locations";
  override entryDateKey = "tst";
  override apiVersion = "v1";
  private maxImportSession = config.importers.location.owntracksServer.maxImportSession;

  private callThrottleInMs = 100;

  /**
   * One of those cases that we can't know if there's new data before calling the API so always return true
   * and let the importer try to fetch data from the API
   */
  public async sourceHasNewData(): Promise<{
    result: boolean;
    from?: DateTime;
    totalEstimate?: number;
  }> {
    return { result: true };
  }

  public async import(params: { tx: DBTransaction; placeholderJobId: number; from?: DateTime }): Promise<{
    importedCount: number;
    firstEntryDate: Date;
    lastEntryDate: Date;
    apiCallsCount?: number;
    logs: string[];
  }> {
    const { tx, placeholderJobId } = params;
    let importedCount = 0;
    let apiCallsCount = 0;

    // Not using tx because otherwise it would fetch the job that was created as a placeholder
    const lastJob = await db.query.importJobsTable.findFirst({
      where: eq(importJobsTable.source, this.sourceId),
      orderBy: desc(importJobsTable.lastEntryDate),
    });

    const currentDate = lastJob
      ? DateTime.fromJSDate(lastJob.lastEntryDate, { zone: "UTC" }).plus({ millisecond: 1 })
      : DateTime.now().minus({ years: 15 }).startOf("day");

    const users = await this.getAllUsersAndDevices();

    for (const user of users) {
      const { apiCallCount, importedCount: extraImportedCount } = await this.fetchAndSaveDataForPeriod(currentDate, {
        tx,
        placeholderJobId,
        user: user.user,
        device: user.device,
      });
      importedCount += extraImportedCount;
      apiCallsCount += apiCallCount;
    }

    return {
      importedCount,
      firstEntryDate: this.firstEntry ?? new Date(),
      lastEntryDate: this.lastEntry ?? new Date(),
      apiCallsCount,
      logs: [],
    };
  }

  private async getAllUsersAndDevices() {
    const url = getEnvVarOrError(EnvVar.OWNTRACKS_HTTP_SERVER);
    const http = axios.create({
      baseURL: url,
    });

    const usersResponse = await http.get("/api/0/list");
    const users: string[] = usersResponse.data.results;
    const result: {
      user: string;
      device: string;
    }[] = [];
    for (const user of users) {
      const devicesResponse = await http.get("/api/0/list", { params: { user } });
      const devices: string[] = devicesResponse.data.results;
      result.push(
        ...devices.map((d) => ({
          device: d,
          user,
        })),
      );
    }
    return result;
  }

  private async fetchAndSaveDataForPeriod(
    startDate: DateTime,
    params: {
      tx: DBTransaction;
      placeholderJobId: number;
      user: string;
      device: string;
    },
  ) {
    const { tx, ...otherParams } = params;
    let currentDate = startDate;
    let apiCallCount = 0;
    let importedCount = 0;
    while (currentDate.diffNow("milliseconds").milliseconds < 0) {
      await delay(this.callThrottleInMs);
      const { formattedEntries, searchedUntil } = await this.fetchDataForDay(currentDate, otherParams);
      for (const entry of formattedEntries) {
        this.updateFirstAndLastEntry(entry.locationFix);
      }

      if (formattedEntries.length) {
        const chunks = chunk(formattedEntries, 1000);
        for (const chunk of chunks) {
          const locations = await tx.insert(locationsTable).values(chunk).returning({ id: locationsTable.id });

          importedCount += locations.length;
        }
      }

      apiCallCount++;
      currentDate = searchedUntil;

      if (importedCount >= this.maxImportSession) {
        break;
      }
    }

    return { apiCallCount, importedCount };
  }

  private async fetchDataForDay(
    startDate: DateTime,
    params: {
      placeholderJobId: number;
      user: string;
      device: string;
    },
  ) {
    const { placeholderJobId, user, device } = params;
    const url = getEnvVarOrError(EnvVar.OWNTRACKS_HTTP_SERVER);
    const http = axios.create({
      baseURL: url,
    });
    const endDate = startDate.plus({ hour: 24 });
    const headers = {
      "X-Limit-From": startDate.toISO(),
      "X-Limit-To": endDate.toISO(),
    };
    this.logger.debug("Calling server", {
      headers,
      params,
    });
    const response = await http.get("/api/0/locations", {
      params: {
        user,
        device,
      },
      headers,
    });
    const recordings = OwntracksLocationApiResponseSchema.parse(response.data);

    const { data } = recordings;
    const formattedEntries = data.map((entry) => this.formatApiEntry(placeholderJobId, entry));
    return { formattedEntries, searchedUntil: endDate };
  }

  private formatApiEntry(jobId: number, entry: OwntracksLocation): NewLocation {
    const batteryStatus = this.getBatteryStatus(entry);
    const connectionStatus = this.getConnectionStatus(entry);
    const trigger = this.getTrigger(entry);

    if (!entry.tzname) {
      throw new Error("No timezone found for entry");
    }

    return {
      // Use the created_at as the external id. It's a bit of a work around, but might be fine as long as we don't have 2
      // entries created at the exact same time
      externalId: entry.created_at,
      accuracy: entry.acc,
      verticalAccuracy: entry.vac,
      velocity: entry.vel,
      altitude: entry.alt,
      battery: entry.batt,
      batteryStatus,
      connectionStatus,
      location: {
        lat: entry.lat,
        lng: entry.lon,
      },
      wifiSSID: entry.SSID,
      topic: entry.topic,
      rawData: JSON.stringify(entry),
      source: "owntracks_api",
      trigger,
      importJobId: jobId,

      // Owntracks api returns date in seconds since epoch, but JS uses milliseconds since epoch
      messageCreatedAt: entry.created_at ? new Date(entry.created_at * 1000) : null,
      locationFix: entry.tst ? new Date(entry.tst * 1000) : null,
      timezone: entry.tzname,
      createdAt: new Date(),
    };
  }

  private getTrigger(entry: OwntracksLocation): (typeof locationTriggerEnum.enumValues)[number] | null {
    switch (entry.t) {
      case "c":
      case "C":
        return "circular";
      case "p":
        return "ping";
      case "r":
        return "report_location";
      case "u":
        return "manual";
      // case "t":
      // case "b":
      // case "v":
      default:
        return null;
    }
  }

  private getBatteryStatus(entry: OwntracksLocation): (typeof batteryStatusEnum.enumValues)[number] | null {
    switch (entry.bs) {
      case 0:
        return "unknown";
      case 1:
        return "unplugged";
      case 2:
        return "charging";
      case 3:
        return "full";
      default:
        return null;
    }
  }

  private getConnectionStatus(entry: OwntracksLocation): (typeof connectionStatusEnum.enumValues)[number] | null {
    switch (entry.conn) {
      case "w":
        return "wifi";
      case "o":
        return "offline";
      case "m":
        return "data";
      default:
        return null;
    }
  }
}

import { sql } from "drizzle-orm";
import { DateTime } from "luxon";
import { z } from "zod";
import type { DBTransaction } from "../../db/types";
import { EnvVar, getEnvVarOrError } from "../../helpers/envVars";
import { offsetToTimezone } from "../../helpers/offsetToTimezone";
import { locationsTable } from "../../models";
import { BaseImporter } from "../BaseImporter";

/**
 * Matches: 2013-05-25T16:00:00.000-04:00
 */
const dateTimeWithTimezoneOffet = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[-+]\d{2}:\d{2}$/;

/**
 * Matches the new JSON export https://support.google.com/maps/thread/264641290/export-full-location-timeline-data-in-json-or-similar-format-in-the-new-version-of-timeline?hl=en
 */
const exportSchema = z.object({
  semanticSegments: z.array(
    z.object({
      startTime: z.string().regex(dateTimeWithTimezoneOffet),
      endTime: z.string().regex(dateTimeWithTimezoneOffet),
      timelinePath: z
        .array(
          z.object({
            point: z.string(),
            time: z.string().regex(dateTimeWithTimezoneOffet),
          }),
        )
        .optional(),
      visit: z
        .object({
          topCandidate: z.object({
            placeLocation: z.object({
              latLng: z.string(),
            }),
            placeId: z.string(),
          }),
        })
        .optional(),
      activity: z
        .object({
          start: z.object({
            latLng: z.string(),
          }),
          end: z.object({
            latLng: z.string(),
          }),
        })
        .optional(),
    }),
  ),
  rawSignals: z.array(
    z.object({
      activityRecord: z
        .object({
          probableActivities: z.array(z.unknown()),
        })
        .optional(),
      wifiScan: z
        .object({
          deliveryTime: z.string().regex(dateTimeWithTimezoneOffet),
          deviceRecords: z.array(z.unknown()).optional(),
        })
        .optional(),
      position: z
        .object({
          LatLng: z.string(),
          accuracyMeters: z.number(),
          altitudeMeters: z.number(),
          source: z.enum(["WIFI", "CELL", "GPS", "UNKNOWN"]),
          timestamp: z.string().regex(dateTimeWithTimezoneOffet),
          speedMetersPerSecond: z.number(),
        })
        .optional(),
    }),
  ),
});

export class GoogleLocationsTimelineImporter extends BaseImporter {
  override sourceId = "google-new-timeline-locations-export";
  override destinationTable = "locations";
  override entryDateKey = "";
  private sourceName = "google" as const;

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
    await params.tx.delete(locationsTable).where(sql`source = ${this.sourceName}`);
    const { importedCount, logs } = await this.handleExport(params);
    return {
      importedCount,
      firstEntryDate: new Date(),
      lastEntryDate: new Date(),
      logs,
    };
  }

  private formatLatLng(latLng: string): { lat: number; lng: number } {
    const [lat, lng] = latLng.replace(" ", "").replace("°", "").split(",");
    return { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) };
  }

  private parseDateTime(dateTime: string): DateTime {
    // "2013-05-25T16:00:00.000-04:00",
    return DateTime.fromFormat(dateTime.replace("T", " "), "yyyy-MM-dd HH:mm:ss.SSSZZ");
  }

  private getTimezoneFromDate(date: DateTime): string {
    return offsetToTimezone(`UTC${date.zone.formatOffset(date.toMillis(), "techie")}`);
  }

  private async handleExport(params: { tx: DBTransaction; placeholderJobId: number }): Promise<{
    importedCount: number;
    logs: string[];
  }> {
    const path = getEnvVarOrError(EnvVar.GOOGLE_LOCATIONS_EXPORT_JSON);
    const dataJson = await import(path);
    let importedCount = 0;
    const exportData = await exportSchema.safeParseAsync(dataJson);

    if (!exportData.data) {
      throw new Error(`Failed to parse JSON: ${JSON.stringify(exportData.error?.errors.splice(0, 10))}`);
    }

    for (const segment of exportData.data.semanticSegments) {
      importedCount += await this.handleVisit(segment, params);
      importedCount += await this.handleActivity(segment, params);
      importedCount += await this.handleTimelinePath(segment, params);
    }

    for (const signal of exportData.data.rawSignals) {
      importedCount += await this.handleRawSignal(signal, params);
    }

    return { importedCount, logs: [] };
  }

  private async handleVisit(
    segment: z.infer<typeof exportSchema>["semanticSegments"][number],
    params: {
      tx: DBTransaction;
      placeholderJobId: number;
    },
  ) {
    const { tx, placeholderJobId } = params;
    if (!segment.visit) {
      return 0;
    }
    const { lat, lng } = this.formatLatLng(segment.visit.topCandidate.placeLocation.latLng);
    const locationFix = this.parseDateTime(segment.startTime);
    const timezone = this.getTimezoneFromDate(locationFix);
    await tx.insert(locationsTable).values([
      {
        source: this.sourceName,
        timezone,
        location: {
          lat,
          lng,
        },
        locationFix: locationFix.toJSDate(),
        importJobId: placeholderJobId,
      },
    ]);

    return 1;
  }

  private async handleActivity(
    segment: z.infer<typeof exportSchema>["semanticSegments"][number],
    params: {
      tx: DBTransaction;
      placeholderJobId: number;
    },
  ) {
    let importedCount = 0;
    const { tx, placeholderJobId } = params;
    if (!segment.activity) {
      return 0;
    }

    const { lat: startLat, lng: startLng } = this.formatLatLng(segment.activity.start.latLng);
    const { lat: endLat, lng: endLng } = this.formatLatLng(segment.activity.end.latLng);
    const locationFixStart = this.parseDateTime(segment.startTime);
    const locationFixEnd = this.parseDateTime(segment.startTime);
    const timezoneStart = this.getTimezoneFromDate(locationFixStart);
    const timezoneEnd = this.getTimezoneFromDate(locationFixEnd);
    await tx.insert(locationsTable).values([
      {
        source: this.sourceName,
        timezone: timezoneStart,
        location: {
          lat: startLat,
          lng: startLng,
        },
        locationFix: locationFixStart.toJSDate(),
        importJobId: placeholderJobId,
      },
    ]);

    importedCount += 1;
    await tx.insert(locationsTable).values([
      {
        source: this.sourceName,
        timezone: timezoneEnd,
        location: {
          lat: endLat,
          lng: endLng,
        },
        locationFix: locationFixEnd.toJSDate(),
        importJobId: placeholderJobId,
      },
    ]);
    importedCount += 1;
    return importedCount;
  }

  private async handleTimelinePath(
    segment: z.infer<typeof exportSchema>["semanticSegments"][number],
    params: {
      tx: DBTransaction;
      placeholderJobId: number;
    },
  ) {
    let importedCount = 0;
    const { tx, placeholderJobId } = params;
    if (!segment.timelinePath) {
      return 0;
    }

    for (const point of segment.timelinePath) {
      const { lat, lng } = this.formatLatLng(point.point);
      const locationFix = this.parseDateTime(point.time);
      const timezone = this.getTimezoneFromDate(locationFix);
      await tx.insert(locationsTable).values([
        {
          source: this.sourceName,
          timezone,
          location: {
            lat,
            lng,
          },
          locationFix: locationFix.toJSDate(),
          importJobId: placeholderJobId,
        },
      ]);
      importedCount += 1;
    }

    return importedCount;
  }

  private async handleRawSignal(
    signal: z.infer<typeof exportSchema>["rawSignals"][number],
    params: {
      tx: DBTransaction;
      placeholderJobId: number;
    },
  ) {
    const { tx, placeholderJobId } = params;
    if (!signal.position) {
      return 0;
    }
    const { lat, lng } = this.formatLatLng(signal.position.LatLng);
    const locationFix = this.parseDateTime(signal.position.timestamp);
    const timezone = this.getTimezoneFromDate(locationFix);
    await tx.insert(locationsTable).values([
      {
        source: this.sourceName,
        timezone,
        location: {
          lat,
          lng,
        },
        locationFix: locationFix.toJSDate(),
        importJobId: placeholderJobId,
      },
    ]);
    return 1;
  }
}

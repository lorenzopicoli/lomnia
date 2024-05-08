import Database from "better-sqlite3";
import { asc, desc, eq, getTableName, gt, sql } from "drizzle-orm";
import {
	type BetterSQLite3Database,
	drizzle,
} from "drizzle-orm/better-sqlite3";
import type { SQLiteSelectQueryBuilder } from "drizzle-orm/sqlite-core";
import { db } from "../../db/connection";
import {
	type ImportJob,
	type NewLocation,
	importJobsTable,
	locationsTable,
} from "../../db/schema";
import type { DBTransaction } from "../../db/types";
import { MissingFieldError, UnexpectedValueError } from "../../errors";
import externalLocationSchema from "./schema/externalLocationSchema";
import { type ExternalLocation, externalLocationsTable } from "./schema/tables";

export class ExternalDnsRequestImporter {
	private importDb: BetterSQLite3Database<typeof externalLocationSchema>;
	private sourceId = "sqlite-dns-requests-v1";
	private destinationTable = getTableName(locationsTable);
	private entryDateKey = "timestamp";
	private importBatchSize = 3000;
	private placeholderDate = new Date(1997, 6, 6);

	private jobStart = new Date();

	constructor(filePath: string) {
		const sqlite = new Database(filePath);
		this.importDb = drizzle(sqlite, {
			logger: false,
			schema: externalLocationSchema,
		});
	}

	private withFilters<T extends SQLiteSelectQueryBuilder>(
		qb: T,
		startDate?: Date,
	) {
		return qb
			.where(
				startDate ? gt(externalLocationsTable.timestamp, startDate) : undefined,
			)
			.orderBy(asc(externalLocationsTable.timestamp));
	}

	private fetchFromSource(offset: number, startDate?: Date) {
		const query = this.importDb.select().from(externalLocationsTable);

		return this.withFilters(query.$dynamic(), startDate)
			.orderBy(asc(externalLocationsTable.timestamp))
			.limit(this.importBatchSize)
			.offset(offset);
	}

	public async sourceHasNewData(): Promise<{ result: boolean; from?: Date }> {
		const lastJob = await db.query.importJobsTable.findFirst({
			where: eq(importJobsTable.source, this.sourceId),
			orderBy: desc(importJobsTable.lastEntryDate),
		});

		const startDate = lastJob?.lastEntryDate;

		const countQuery = this.importDb
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(externalLocationsTable);

		const count = await this.withFilters(countQuery.$dynamic(), startDate).then(
			(r) => r[0]?.count,
		);

		return {
			result: count > 0,
			from: startDate,
		};
	}

	private async importInternal(tx: DBTransaction, from?: Date) {
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

		while (events?.length !== 0) {
			events = await this.fetchFromSource(currentOffset, from);
			currentOffset += this.importBatchSize;
			if (events.length > 0) {
				await tx
					.insert(locationsTable)
					.values(events.map((e) => this.mapData(placeholderJob.id, e)));

				const firstEntry: ExternalLocation | undefined = events[0];
				const lastEntry: ExternalLocation | undefined =
					events[events.length - 1];

				if (!firstEntryDate && firstEntry?.timestamp) {
					firstEntryDate = firstEntry.timestamp;
				}
				if (lastEntry?.timestamp) {
					lastEntryDate = lastEntry.timestamp;
				}

				importedCount += events.length;
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
		const { result, from } = await this.sourceHasNewData();
		if (!result) {
			return;
		}

		await db
			.transaction(async (tx) => {
				await this.importInternal(tx, from);
			})
			.catch((e) => console.log("NOTHING E", e));
	}

	public mapData(jobId: number, importerData: ExternalLocation): NewLocation {
		if (!importerData.id) {
			throw new MissingFieldError("id");
		}
		if (
			importerData.batteryStatus === undefined ||
			importerData.batteryStatus === null
		) {
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
		const connectionMap: Record<
			NonNullable<ExternalLocation["connectionStatus"]>,
			NewLocation["connectionStatus"]
		> = {
			w: "wifi",
			o: "offline",
			m: "data",
		};
		const connectionStatus = importerData.connectionStatus
			? connectionMap[importerData.connectionStatus] ?? null
			: null;

		/**
		 * Battery Status 0=unknown, 1=unplugged, 2=charging, 3=full
		 * https://owntracks.org/booklet/tech/json/
		 */
		const batteryMap: Record<
			NonNullable<ExternalLocation["batteryStatus"]>,
			NewLocation["batteryStatus"]
		> = {
			0: "unknown",
			1: "unplugged",
			2: "charging",
			3: "full",
		};
		const batteryStatus = batteryMap[importerData.batteryStatus] ?? null;

		if (!batteryStatus) {
			throw new UnexpectedValueError(
				`batteryStatus = ${importerData.batteryStatus}`,
			);
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
		const triggerMap: Record<
			NonNullable<ExternalLocation["triggerType"]>,
			NewLocation["trigger"]
		> = {
			p: "ping",
			c: "circular",
			u: "manual",
			r: "report_location",
		};
		const trigger = importerData.triggerType
			? triggerMap[importerData.triggerType] ?? null
			: null;

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

			trigger,

			topic: importerData.originalPublishTopic,
			wifiSSID: importerData.wifiSSID,
			rawData: importerData,

			importJobId: jobId,

			messageCreatedAt: importerData.messageCreationTime,
			locationFix: importerData.timestamp,
		};
	}
}

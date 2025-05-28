import { BaseImporter } from "../BaseImporter";
import type { DBTransaction } from "../../../db/types";
import {
	locationsTable,
	type batteryStatusEnum,
	type connectionStatusEnum,
	type locationTriggerEnum,
	type NewLocation,
} from "../../../models";
import axios from "axios";
import { DateTime } from "luxon";
import { parseOwnTracksApiResponse, type OwnTracksLocation } from "./schema";

export class OwntracksImporter extends BaseImporter {
	override sourceId = "owntracks-api";
	override destinationTable = "locations";
	override entryDateKey = "";
	override apiVersion = "v1";

	public async sourceHasNewData(): Promise<{
		result: boolean;
		from?: DateTime;
		totalEstimate?: number;
	}> {
		return { result: true };
	}

	public async import(params: {
		tx: DBTransaction;
		placeholderJobId: number;
		from?: DateTime;
	}): Promise<{
		importedCount: number;
		firstEntryDate: Date;
		lastEntryDate: Date;
		apiCallsCount?: number;
		logs: string[];
	}> {
		const url = process.env.OWNTRACKS_HTTP_SERVER;
		if (!url) {
			throw new Error("OWNTRACKS_HTTP_SERVER env var is required");
		}

		const { tx, placeholderJobId } = params;
		let importedCount = 0;
		let apiCallsCount = 0;

		const http = axios.create({
			baseURL: url,
		});

		const currentDate = DateTime.now().plus({ days: 1 });

		while (true) {
			const response = await http.get("/api/0/locations", {
				params: {
					user: "owntracks",
					device: "shiba",
				},
				headers: {
					"X-Limit-From": currentDate.minus({ days: 1 }).toFormat("yyyy-MM-dd"),
					"X-Limit-To": currentDate.toFormat("yyyy-MM-dd"),
				},
			});
			apiCallsCount++;

			const recordings = parseOwnTracksApiResponse(response.data);

			if (recordings.count === 0) {
				break;
			}

			const { data } = recordings;
			const formattedEntries = data.map((entry) =>
				this.formatApiEntry(placeholderJobId, entry),
			);

			for (const entry of formattedEntries) {
				this.updateFirstAndLastEntry(entry.locationFix);
			}

			const locations = await tx
				.insert(locationsTable)
				.values(formattedEntries)
				.returning({ id: locationsTable.id });

			importedCount += locations.length;
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
		const url = process.env.OWNTRACKS_HTTP_SERVER;
		if (!url) {
			throw new Error("OWNTRACKS_HTTP_SERVER env var is required");
		}

		const http = axios.create({
			baseURL: url,
		});

		const usersResponse = await http.get("/api/0/list");
		const users: string[] = usersResponse.data.results;
		const result: { user: string; device: string }[] = [];
		for (const user of users) {
			const devicesResponse = await http.get("/api/0/list", { params: user });
			const devices: string[] = devicesResponse.data.results;
			result.push(...devices.map((d) => ({ device: d, user })));
		}
		return result;
	}

	private formatApiEntry(jobId: number, entry: OwnTracksLocation): NewLocation {
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
			location: { lat: entry.lat, lng: entry.lon },
			source: "owntracks-api",
			trigger,
			importJobId: jobId,

			messageCreatedAt: entry.created_at ? new Date(entry.created_at) : null,
			locationFix: entry.tst ? new Date(entry.tst) : null,
			timezone: entry.tzname,
			createdAt: new Date(),
		};
	}

	private getTrigger(
		entry: OwnTracksLocation,
	): (typeof locationTriggerEnum.enumValues)[number] | null {
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

	private getBatteryStatus(
		entry: OwnTracksLocation,
	): (typeof batteryStatusEnum.enumValues)[number] | null {
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

	private getConnectionStatus(
		entry: OwnTracksLocation,
	): (typeof connectionStatusEnum.enumValues)[number] | null {
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

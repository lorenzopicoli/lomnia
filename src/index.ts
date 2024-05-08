import "dotenv/config";
import db from "./db/db";
import { locationsTable } from "./db/schema";
import { ExternalLocationsImporter } from "./importers/locations";

const aha = async () => {
	//   await db.insert(locationsTable).values({
	//     externalId: 1,
	//     accuracy: 2,
	//     vericalAccuracy: 3,
	//     velocity: 4,
	//     altitude: 5,
	//     battery: 100,
	//     batteryStatus: 'unplugged',
	//     connectionStatus: 'wifi',
	//     location: { lat: 1, lng: 1 },

	//     trigger: 'ping',

	//     topic: 'b',
	//     wifiSSID: 'asdasd',
	//     rawData: { asdasd: 1 },

	//     messageCreatedAt: new Date(),
	//     locationFix: new Date(),
	//   })
	//   const locations = await db.select().from(locationsTable)
	//   console.log(locations)

	const a = new ExternalLocationsImporter(
		"/home/lorenzo/Downloads/database(1).db",
	);
	await a.import();
};

aha();

import "dotenv/config";
import { ExternalDnsRequestImporter } from "./importers/dnsQueries";
import { ExternalLocationsImporter } from "./importers/locations";

const main = async () => {
	// const locations = new ExternalLocationsImporter(
	// 	"/home/lorenzo/Downloads/database(1).db",
	// );
	// await locations.import();
	const dnsQueries = new ExternalDnsRequestImporter(
		"/home/lorenzo/Downloads/pihole-FTL(1).db",
	);
	await dnsQueries.import();
};

main();

import 'dotenv/config'
import { ExternalDnsRequestImporter } from './services/importers/dnsQueries'
import { ExternalLocationsImporter } from './services/importers/locations'
const importLocations = async () => {
  const locationsImporter = await new ExternalLocationsImporter()
  await locationsImporter.fetchDataForImport()
  await locationsImporter.import()
}
const importDnsQueries = async () => {
  const dnsQueriesImporter = new ExternalDnsRequestImporter()
  await dnsQueriesImporter.fetchDataForImport()
  await dnsQueriesImporter.import()
}
const main = async () => {
  console.log('================== LOCATIONS IMPORT ================== ')
  await importLocations()
  console.log()
  console.log('================= DNS QUERIES IMPORT ================= ')
  await importDnsQueries()
}

main()

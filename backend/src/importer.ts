import 'dotenv/config'
import { ExternalDnsRequestImporter } from './services/importers/dnsQueries'
import { ExternalLocationsImporter } from './services/importers/locations'
import { ObsidianImporter } from './services/importers/obsidian'
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
const importObsidianFiles = async () => {
  const obsidianImporter = new ObsidianImporter()
  await obsidianImporter.import()
}
const main = async () => {
  console.log('================== LOCATIONS IMPORT ================== ')
  await importLocations()
  console.log()
  console.log('================= DNS QUERIES IMPORT ================= ')
  await importDnsQueries()
  console.log('================= OBSIDIAN IMPORT ================= ')
  await importObsidianFiles()
}

main()

// Obsidian Files
// - tags
// - checksum
// - content
// - file_creation_date
// - type
// - source="obsdian"

// Habit_logs
// - date
// - key (oneOf)
// - value (jsonb)

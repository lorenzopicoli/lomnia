import 'dotenv/config'
import { PiholeSchemaRequestImporter } from './services/importers/pihole'
import { ExternalLocationsImporter } from './services/importers/locations'
import { ObsidianImporter } from './services/importers/obsidian'
import { OpenMeteoImport } from './services/importers/openMeteo'
const importLocations = async () => {
  const locationsImporter = await new ExternalLocationsImporter()
  await locationsImporter.fetchDataForImport()
  await locationsImporter.import()
}
const importDnsQueries = async () => {
  const piholeImporter = new PiholeSchemaRequestImporter()
  await piholeImporter.fetchDataForImport()
  await piholeImporter.import()
}
const importObsidianFiles = async () => {
  const obsidianImporter = new ObsidianImporter()
  await obsidianImporter.import()
}
const importOpenMeteoData = async () => {
  const openMeteoImporter = new OpenMeteoImport()
  await openMeteoImporter.startJob()
}
const main = async () => {
  console.log('================== LOCATIONS IMPORT ================== ')
  await importLocations()
  console.log('================= DNS QUERIES IMPORT ================= ')
  await importDnsQueries()
  console.log('================= OBSIDIAN IMPORT ================= ')
  await importObsidianFiles()
  console.log('================= OPEN METEO IMPORT ================= ')
  await importOpenMeteoData()
}

main()

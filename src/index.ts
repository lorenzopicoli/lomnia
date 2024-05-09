import 'dotenv/config'
import * as readline from 'node:readline'
import humanFileSize from './helpers/humanFileSize'
import { ExternalDnsRequestImporter } from './importers/dnsQueries'
import { ExternalLocationsImporter } from './importers/locations'
import { newSSHConnection } from './importers/ssh'
const importLocations = async () => {
  const locationsImporter = await new ExternalLocationsImporter()
  await locationsImporter.fetchDataForImport()
  await locationsImporter.import()
}
const importDnsQueries = async () => {
  const conn = await newSSHConnection('192.168.40.2')
  await conn
    .execCommand(
      `sudo docker exec pihole /bin/bash -c "sudo service pihole-FTL stop"`
    )
    .then((result) => {
      console.log(`Stopped pihole: ${result.stdout}`)
      console.log(`Error stopping pihole: ${result.stderr}`)
    })
  await new Promise((r) => setTimeout(r, 2000))
  await conn
    .execCommand(
      'cp /var/lib/docker/volumes/pihole_pihole_etc/_data/pihole-FTL.db /home/lorenzo/pihole-backup.db'
    )
    .then((result) => {
      console.log(`Backed up pihole: ${result.stdout}`)
      console.log(`Error backing up pihole: ${result.stderr}`)
    })
  await conn
    .execCommand(
      `sudo docker exec pihole /bin/bash -c "sudo service pihole-FTL start"`
    )
    .then((result) => {
      console.log(`Started pihole: ${result.stdout}`)
      console.log(`Error starting pihole: ${result.stderr}`)
    })

  const dnsQueriesImporter = new ExternalDnsRequestImporter()
  await dnsQueriesImporter.fetchDataForImport(conn)
  await conn.execCommand('rm /home/lorenzo/pihole-backup.db').then((result) => {
    console.log(`Deleted pihole backup: ${result.stdout}`)
    console.log(`Error deleting pihole backup: ${result.stderr}`)
  })
  await dnsQueriesImporter.import()
}
const main = async () => {
  await importLocations()
  await importDnsQueries()
  // TODO: Fix progress bars
}

main()

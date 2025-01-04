import { eq } from 'drizzle-orm'
import { db } from '../../db/connection'
import { writeFile } from 'fs/promises'
import path from 'path'
import { locationDetailsTable, locationsTable } from '../../models'

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    battery_state: string
    ping: null
    battery_level: number
    device_id: string
    topic: string
    altitude: number
    longitude: number
    speed: string
    trigger: string
    bssid?: string
    wifi?: string
    connection: string
    vertical_accuracy: number
    accuracy: number
    timestamp: number
    latitude: number
    mode: null
    inrids: null
    in_regions: null
    city: string
    country: string
    geodata: {
      type: 'Feature'
      geometry: {
        type: 'Point'
        coordinates: [number, number]
      }
      properties: {
        city: string
        type: string
        state: string
        county: string
        osm_id: number
        street: string
        country: string
        osm_key: string
        district: string
        locality: string
        osm_type: string
        postcode: string
        osm_value: string
        countrycode: string
        housenumber: string
      }
    }
    reverse_geocoded_at: string
  }
}

interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export async function exportLocationsToJSON(
  outputDir: string,
  batchSize: number = 1,
  maxFileSize: number = 100 * 1024 * 1024 // 100MB in bytes
) {
  let offset = 10
  let fileIndex = 1
  let currentFileSize = 0
  let currentFeatures: GeoJSONFeature[] = []

  while (true) {
    // Fetch locations with their details
    const locations = await db
      .select()
      .from(locationsTable)
      .leftJoin(
        locationDetailsTable,
        eq(locationsTable.locationDetailsId, locationDetailsTable.id)
      )
      .limit(batchSize)
      .offset(offset)

    if (locations.length === 0) break

    for (const row of locations) {
      const location = row.locations
      const details = row.location_details
      const coords = location.location

      // Extract coordinates from geography type
      // Assuming the geography column is in POINT format

      const feature: GeoJSONFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords.lng, coords.lat],
        },
        properties: {
          battery_state: location.batteryStatus || 'unknown',
          ping: null,
          battery_level: location.battery || 0,
          device_id: 'ba', // You might want to make this configurable
          topic: location.topic || '',
          altitude: location.altitude || 0,
          longitude: coords.lng,
          speed: location.velocity?.toString() || '0',
          trigger: location.trigger || 'unknown',
          connection:
            location.connectionStatus === 'data'
              ? 'mobile'
              : location.connectionStatus || 'wifi',
          vertical_accuracy: location.verticalAccuracy || 0,
          accuracy: location.accuracy || 0,
          timestamp: location.locationFix
            ? Math.floor(location.locationFix.getTime() / 1000)
            : 0,
          latitude: coords.lat,
          mode: null,
          inrids: null,
          in_regions: null,
          city: details?.city || '',
          country: details?.country || '',
          geodata: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coords.lng, coords.lat],
            },
            properties: {
              city: details?.city || '',
              type: details?.type || 'house',
              state: details?.state || '',
              county: details?.county || '',
              osm_id: parseInt(details?.osmId || '0'),
              street: details?.road || '',
              country: details?.country || '',
              osm_key: 'place',
              district: details?.neighbourhood || '',
              locality: details?.suburb || '',
              osm_type: details?.osmType || 'N',
              postcode: details?.postcode || '',
              osm_value: details?.type || 'house',
              countrycode: details?.countryCode || '',
              housenumber: details?.houseNumber || '',
            },
          },
          reverse_geocoded_at: new Date().toISOString(),
        },
      }

      // Add WiFi details if available
      if (location.wifiSSID) {
        feature.properties.wifi = location.wifiSSID
      }

      const featureSize = Buffer.from(JSON.stringify(feature)).length

      if (currentFileSize + featureSize > maxFileSize) {
        // Write current batch to file
        await writeToFile(currentFeatures, fileIndex, outputDir)
        fileIndex++
        currentFeatures = []
        currentFileSize = 0
      }

      currentFeatures.push(feature)
      currentFileSize += featureSize
    }

    offset += batchSize
  }

  // Write any remaining features
  if (currentFeatures.length > 0) {
    await writeToFile(currentFeatures, fileIndex, outputDir)
  }
}

async function writeToFile(
  features: GeoJSONFeature[],
  fileIndex: number,
  outputDir: string
) {
  const collection: GeoJSONCollection = {
    type: 'FeatureCollection',
    features,
  }

  const filename = path.join(outputDir, `locations_${fileIndex}.json`)
  await writeFile(filename, JSON.stringify(collection, null, 2))
  console.log(`Written file: ${filename}`)
}

import DeckGL, {
  HeatmapLayer,
  WebMercatorViewport,
  type MapViewState,
  type DeckProps,
} from 'deck.gl'
import { Map as MapLibre } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type MapQuadrant from '../types/MapQuadrant'

type DataPoint = [longitude: number, latitude: number, count: number]
const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/screen-grid/uber-pickup-locations.json'

export type HeatmapProps = {
  onViewChange?: (quadrant: MapQuadrant) => void | Promise<void>
}

export default function Heatmap(props: HeatmapProps) {
  const MAP_STYLE =
    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  const INITIAL_VIEW_STATE: MapViewState = {
    longitude: -73.75,
    latitude: 40.73,
    zoom: 9,
    maxZoom: 16,
    pitch: 0,
    bearing: 0,
  }
  const layers = [
    new HeatmapLayer<DataPoint>({
      data: DATA_URL,
      id: 'heatmap-layer',
      pickable: false,
      getPosition: (d) => [d[0], d[1]],
      getWeight: (d) => d[2],
      radiusPixels: 2,
      intensity: 0.5,
      threshold: 0.1,
    }),
  ]

  const handleViewStateChange: DeckProps['onViewStateChange'] = (params) => {
    const viewport = new WebMercatorViewport(params.viewState)
    const { width, height } = viewport
    const quadrant = [
      viewport.unproject([0, 0]),
      viewport.unproject([width, 0]),
      viewport.unproject([width, height]),
      viewport.unproject([0, height]),
    ]
    props.onViewChange?.({
      topLeftLat: quadrant[0][1],
      topLeftLng: quadrant[0][0],
      topRightLat: quadrant[1][1],
      topRightLng: quadrant[1][0],
      bottomRightLat: quadrant[2][1],
      bottomRightLng: quadrant[2][0],
      bottomLeftLat: quadrant[3][1],
      bottomLeftLng: quadrant[3][0],
    })
  }

  return (
    <DeckGL
      style={{ position: 'relative', width: '100%', height: '100%' }}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layers}
      onViewStateChange={handleViewStateChange}
    >
      <MapLibre reuseMaps mapStyle={MAP_STYLE} />
    </DeckGL>
  )
}

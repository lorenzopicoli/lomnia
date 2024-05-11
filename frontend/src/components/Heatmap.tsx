import DeckGL, {
  HeatmapLayer,
  WebMercatorViewport,
  type MapViewState,
  type DeckProps,
} from 'deck.gl'
import { Map as MapLibre } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type MapViewParams from '../types/MapViewParams'

type DataPoint = [longitude: number, latitude: number, count: number]
export type HeatmapProps = {
  onViewChange?: (params: MapViewParams) => void | Promise<void>
  points: DataPoint[]
}

export default function Heatmap(props: HeatmapProps) {
  const MAP_STYLE =
    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  const INITIAL_VIEW_STATE: MapViewState = {
    longitude: -73.6287938,
    latitude: 45.517205,
    zoom: 9,
    maxZoom: 16,
    pitch: 0,
    bearing: 0,
  }
  const layers = [
    new HeatmapLayer<DataPoint>({
      data: props.points,
      id: 'heatmap-layer',
      pickable: false,
      getPosition: (d) => [d[0], d[1]],
      getWeight: (d) => d[2],
      radiusPixels: 3,
      aggregation: 'MEAN',
      intensity: 1,
      threshold: 0.1,
      opacity: 0.7,
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
      bottomRightLat: quadrant[2][1],
      bottomRightLng: quadrant[2][0],
      zoom: viewport.zoom,
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

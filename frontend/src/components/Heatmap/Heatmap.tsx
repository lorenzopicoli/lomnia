import DeckGL, { HeatmapLayer, WebMercatorViewport, type DeckProps } from "deck.gl";
import { Map as MapLibre } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { memo } from "react";
import type MapViewParams from "../../types/MapViewParams";

type DataPoint = [longitude: number, latitude: number, count: number];
export type HeatmapProps = {
  onViewChange?: (params: MapViewParams) => void | Promise<void>;
  fitToBounds: boolean;
  points: DataPoint[];
};

// This shouldn't happen here, the backend should return the bounds for the given period
function findBounds(points: DataPoint[]) {
  if (points.length === 0) {
    throw new Error("Points list cannot be empty");
  }

  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];

  for (const point of points) {
    const [lng, lat] = point;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const topLeft: [number, number] = [minLng, maxLat];
  const bottomRight: [number, number] = [maxLng, minLat];

  return { topLeft, bottomRight };
}

function Heatmap(props: HeatmapProps) {
  const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  let initialViewState = undefined;
  if (props.fitToBounds) {
    const bounds = findBounds(props.points);
    const { longitude, latitude, zoom } = new WebMercatorViewport({
      width: 449,
      height: 449,
    }).fitBounds([bounds.topLeft, bounds.bottomRight]);
    initialViewState = { longitude, latitude, zoom };
  }

  const layers = [
    new HeatmapLayer<DataPoint>({
      data: props.points,
      id: "heatmap-layer",
      pickable: false,
      getPosition: (d) => [d[0], d[1]],
      getWeight: (d) => d[2],
      radiusPixels: 3,
      aggregation: "MEAN",
      intensity: 1,
      threshold: 0.1,
      opacity: 0.7,
    }),
  ];

  const handleViewStateChange: DeckProps["onViewStateChange"] = (params) => {
    const viewport = new WebMercatorViewport(params.viewState);
    const { width, height } = viewport;
    const quadrant = [
      viewport.unproject([0, 0]),
      viewport.unproject([width, 0]),
      viewport.unproject([width, height]),
      viewport.unproject([0, height]),
    ];
    props.onViewChange?.({
      topLeftLat: quadrant[0][1],
      topLeftLng: quadrant[0][0],
      bottomRightLat: quadrant[2][1],
      bottomRightLng: quadrant[2][0],
      zoom: viewport.zoom,
    });
  };

  return (
    <DeckGL
      style={{ position: "relative", width: "100%", height: "100%" }}
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
      onViewStateChange={handleViewStateChange}
    >
      <MapLibre reuseMaps mapStyle={MAP_STYLE} />
    </DeckGL>
  );
}

// Memoing causes some crashes. I think related to https://github.com/visgl/deck.gl/issues/8841
// const MemoedHeatmap = memo(Heatmap)
export default Heatmap;

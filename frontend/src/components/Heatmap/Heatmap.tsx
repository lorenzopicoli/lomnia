import DeckGL, { type DeckProps, HeatmapLayer, WebMercatorViewport } from "deck.gl";
import { Map as MapLibre } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useMemo } from "react";
import type MapViewParams from "../../types/MapViewParams";

type DataPoint = [longitude: number, latitude: number, count: number];
type HeatmapProps = {
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
  const { ref, width, height } = useElementSize();
  const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  const initialViewState = useMemo(() => {
    if (!props.fitToBounds) return undefined;
    if (!width || !height) return undefined;
    if (props.points.length === 0) return undefined;

    const bounds = findBounds(props.points);

    const viewport = new WebMercatorViewport({
      width,
      height,
    }).fitBounds([bounds.topLeft, bounds.bottomRight], {
      padding: 40,
    });

    return {
      longitude: viewport.longitude,
      latitude: viewport.latitude,
      zoom: viewport.zoom,
    };
  }, [props.fitToBounds, props.points, width, height]);
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
    <Box ref={ref} flex={1} mih={0} w="100%" h="100%" style={{ position: "relative" }}>
      <DeckGL initialViewState={initialViewState} controller layers={layers} onViewStateChange={handleViewStateChange}>
        <MapLibre reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
    </Box>
  );
}

// Memoing causes some crashes. I think related to https://github.com/visgl/deck.gl/issues/8841
// const MemoedHeatmap = memo(Heatmap)
export default Heatmap;

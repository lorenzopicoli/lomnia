import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { Box, Card, Text } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import DeckGL, { WebMercatorViewport } from "deck.gl";
import { useEffect, useState } from "react";
import { Map as MapLibre } from "react-map-gl/maplibre";

type LocationPoint = {
  longitude: number;
  latitude: number;
  timestamp: string;
};

type Props = {
  sortedPoints: LocationPoint[];
};

export function LocationHistoryMap({ sortedPoints }: Props) {
  const { ref, width, height } = useElementSize();
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);

  const [viewState, setViewState] = useState<any>({
    longitude: -40,
    latitude: -20,
    zoom: 14,
  });

  useEffect(() => {
    if (!width || !height || sortedPoints.length === 0) return;

    const lons = sortedPoints.map((p) => p.longitude);
    const lats = sortedPoints.map((p) => p.latitude);

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];

    const viewport = new WebMercatorViewport({
      width,
      height,
    }).fitBounds(bounds, { padding: 60 });

    setViewState({
      longitude: viewport.longitude,
      latitude: viewport.latitude,
      zoom: viewport.zoom,
    });
  }, [sortedPoints, width, height]);

  const layers = [
    // Movement path
    new PathLayer({
      id: "movement-path",
      data: [
        {
          path: sortedPoints.map((p) => [p.longitude, p.latitude]),
        },
      ],
      getPath: (d) => d.path,
      getWidth: 2,
      widthUnits: "pixels",
      getColor: [100, 149, 237, 200],
    }),

    // Clickable points
    new ScatterplotLayer<LocationPoint>({
      id: "points-layer",
      data: sortedPoints,
      pickable: true,
      radiusUnits: "pixels",
      radiusMinPixels: 7,
      radiusMaxPixels: 10,
      getPosition: (d) => [d.longitude, d.latitude],
      getFillColor: (d) => {
        const hour = new Date(d.timestamp).getHours();
        return [hour * 10, 100, 255 - hour * 10, 200];
      },
      getLineColor: [255, 255, 255],
      lineWidthMinPixels: 1,
      onClick: (info) => {
        if (info.object) {
          setSelectedPoint(info.object);
        }
      },
    }),
  ];

  const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
  return (
    <Box ref={ref}>
      <DeckGL
        viewState={viewState}
        controller
        layers={layers}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        getTooltip={({ object }) =>
          object
            ? {
                text: new Date(object.timestamp).toLocaleString(),
              }
            : null
        }
      >
        <MapLibre
          reuseMaps
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          // mapStyle={MAP_STYLE}
        />
      </DeckGL>

      {/* Mantine popup */}
      {selectedPoint && (
        <Card
          shadow="md"
          padding="sm"
          radius="md"
          withBorder
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            zIndex: 10,
            maxWidth: 260,
          }}
        >
          <Text size="sm" fw={600}>
            Location
          </Text>

          <Text size="xs" c="dimmed">
            {new Date(selectedPoint.timestamp).toLocaleString()}
          </Text>

          <Text size="xs">Lat: {selectedPoint.latitude.toFixed(5)}</Text>

          <Text size="xs">Lng: {selectedPoint.longitude.toFixed(5)}</Text>
        </Card>
      )}
    </Box>
  );
}

import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { Box, Skeleton } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import DeckGL, { WebMercatorViewport } from "deck.gl";
import { useEffect, useState } from "react";
import { Map as MapLibre } from "react-map-gl/maplibre";
import { findBounds } from "../utils/findBounds";

type LocationPoint = {
  longitude: number;
  latitude: number;
  timestamp: string;
};

type Props = {
  points: LocationPoint[];
  isLoading: boolean;
};

export function DailyMap(props: Props) {
  const { points, isLoading } = props;
  const { ref, width, height } = useElementSize();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [viewState, setViewState] = useState<any>({
    longitude: -40,
    latitude: -20,
    zoom: 14,
  });

  useEffect(() => {
    if (!width || !height || points.length === 0) return;

    const bounds = findBounds(points.map((p) => [p.longitude, p.latitude]));

    const viewport = new WebMercatorViewport({
      width,
      height,
    }).fitBounds([bounds.topLeft, bounds.bottomRight], { padding: 60 });

    setViewState({
      longitude: viewport.longitude,
      latitude: viewport.latitude,
      zoom: viewport.zoom,
    });
  }, [points, width, height]);

  const layers = [
    new PathLayer({
      id: "movement-path",
      data: [
        {
          path: points.map((p) => [p.longitude, p.latitude]),
        },
      ],
      getPath: (d) => d.path,
      getWidth: 2,
      widthUnits: "pixels",
      getColor: [100, 149, 237, 200],
    }),

    new ScatterplotLayer<LocationPoint>({
      id: "points-layer",
      data: points,
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
    }),
  ];

  if (isLoading) {
    return <Skeleton h={"100%"} w={"100%"} />;
  }
  return (
    <Box ref={ref} flex={1} mih={0} w="100%" h="100%" style={{ position: "relative" }}>
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
        <MapLibre reuseMaps mapStyle="https://tiles.openfreemap.org/styles/bright" />
      </DeckGL>
    </Box>
  );
}

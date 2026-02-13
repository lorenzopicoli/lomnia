import { GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { Box } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import DeckGL, { WebMercatorViewport } from "deck.gl";
import { useEffect, useMemo, useState } from "react";
import { Map as MapLibre } from "react-map-gl/maplibre";
import type { PolygonFeature, ReadonlyPolygon } from "../../types/PolygonFeature";

type LocationPoint = {
  longitude: number;
  latitude: number;
  timestamp?: string;
};

type Props = {
  value?: PolygonFeature | null;
  readonlyPolygons?: ReadonlyPolygon[];
  points?: LocationPoint[];
};

export function ReadonlyPoiMap(props: Props) {
  const { value, readonlyPolygons, points } = props;

  const { ref, width, height } = useElementSize();

  // biome-ignore lint/suspicious/noExplicitAny
  const [viewState, setViewState] = useState<any>({
    longitude: -40,
    latitude: -20,
    zoom: 13,
  });

  // Fit bounds on mount or when polygons change
  useEffect(() => {
    if (!width || !height) return;

    const features = [...(value ? [value] : []), ...(readonlyPolygons?.map((p) => p.feature) ?? [])];

    if (features.length === 0) return;

    const coordinates: [number, number][] = [];

    for (const feature of features) {
      const geom = feature.geometry;

      if (geom.type === "Polygon") {
        for (const ring of geom.coordinates) {
          for (const coord of ring) {
            coordinates.push(coord as [number, number]);
          }
        }
      }
    }

    if (coordinates.length === 0) return;

    const longitudes = coordinates.map((c) => c[0]);
    const latitudes = coordinates.map((c) => c[1]);

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ];

    const viewport = new WebMercatorViewport({ width, height }).fitBounds(bounds, { padding: 60 });

    setViewState({
      longitude: viewport.longitude,
      latitude: viewport.latitude,
      zoom: viewport.zoom,
    });
  }, [value, readonlyPolygons, width, height]);

  const layers = useMemo(() => {
    const l = [];

    if (readonlyPolygons?.length) {
      l.push(
        new GeoJsonLayer({
          id: "readonly-polygons",
          data: readonlyPolygons.map((p) => p.feature),
          stroked: true,
          filled: true,
          getLineColor: [102, 102, 102],
          getFillColor: [102, 102, 102, 40],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
        }),
      );
    }

    if (value) {
      l.push(
        new GeoJsonLayer({
          id: "value-polygon",
          data: value,
          stroked: true,
          filled: true,
          getLineColor: [100, 149, 237],
          getFillColor: [100, 149, 237, 60],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
        }),
      );
    }

    if (points?.length) {
      l.push(
        new ScatterplotLayer<LocationPoint>({
          id: "points-layer",
          data: points,
          pickable: true,
          radiusUnits: "pixels",
          radiusMinPixels: 6,
          radiusMaxPixels: 10,
          getPosition: (d) => [d.longitude, d.latitude],
          getFillColor: (d) => {
            if (!d.timestamp) return [255, 140, 0, 200];
            const hour = new Date(d.timestamp).getHours();
            return [hour * 10, 100, 255 - hour * 10, 200];
          },
          getLineColor: [255, 255, 255],
          lineWidthMinPixels: 1,
        }),
      );
    }

    if (readonlyPolygons?.length) {
      const labelData = readonlyPolygons.map((p) => {
        const geom = p.feature.geometry;

        let coordinates: [number, number][] = [];

        if (geom.type === "Polygon") {
          coordinates = geom.coordinates[0] as [number, number][];
        }

        const center = coordinates.reduce(
          (acc, coord) => {
            acc[0] += coord[0];
            acc[1] += coord[1];
            return acc;
          },
          [0, 0],
        );

        const centroid: [number, number] = [center[0] / coordinates.length, center[1] / coordinates.length];

        return {
          name: p.name,
          position: centroid,
        };
      });

      l.push(
        new TextLayer({
          id: "polygon-labels",
          data: labelData,
          getPosition: (d) => d.position,
          getText: (d) => d.name,
          getSize: 15,
          sizeUnits: "meters",
          fontFamily: "JetBrains, Mono",
          characterSet: "auto",
          getColor: [60, 60, 60],
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          background: true,
          getBackgroundColor: [255, 255, 255, 220],
          getBorderColor: [150, 150, 150, 200],
          getBorderWidth: 1,
          backgroundPadding: [6, 4],
        }),
      );
    }
    return l;
  }, [readonlyPolygons, value, points]);

  return (
    <Box ref={ref} flex={1} mih={0} w="100%" h="100%" style={{ position: "relative" }}>
      <DeckGL
        viewState={viewState}
        controller
        layers={layers}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
      >
        <MapLibre reuseMaps mapStyle="https://tiles.openfreemap.org/styles/bright" />
      </DeckGL>
    </Box>
  );
}

import { TZDate } from "@date-fns/tz";
import { Box, Popover, Skeleton, Text } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { format } from "date-fns/format";
import DeckGL, { GeoJsonLayer, PathLayer, ScatterplotLayer, TextLayer, WebMercatorViewport } from "deck.gl";
import { useEffect, useMemo, useState } from "react";
import { Map as MapLibre } from "react-map-gl/maplibre";
import type { PolygonFeature, ReadonlyPolygon } from "../types/PolygonFeature";
import { findBounds } from "../utils/findBounds";
import { getHourColors } from "../utils/getHourColors";

type LocationPoint = {
  location: {
    lng: number;
    lat: number;
  };
  recordedAt?: string | null;
  timezone?: string;
};

export type CommonMapProps = {
  value?: PolygonFeature | null;
  readonlyPolygons?: ReadonlyPolygon[];
  points?: LocationPoint[];
  isLoading?: boolean;
};

export function CommonMap(props: CommonMapProps) {
  const { value, readonlyPolygons, points, isLoading } = props;

  const { ref, width, height } = useElementSize();
  // biome-ignore lint/suspicious/noExplicitAny
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  // biome-ignore lint/suspicious/noExplicitAny
  const [viewState, setViewState] = useState<any>({
    longitude: -40,
    latitude: -20,
    zoom: 13,
  });

  useEffect(() => {
    if (!width || !height) return;

    const features = [...(value ? [value] : []), ...(readonlyPolygons?.map((p) => p.feature) ?? [])];

    if (features.length === 0 && (!points || points?.length === 0)) return;

    const coordinates: [number, number][] = points?.map((p) => [p.location.lng, p.location.lat]) ?? [];

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

    const bounds = findBounds(coordinates);

    const viewport = new WebMercatorViewport({
      width,
      height,
    }).fitBounds([bounds.topLeft, bounds.bottomRight], { padding: 60 });
    setViewState({
      longitude: viewport.longitude,
      latitude: viewport.latitude,
      zoom: viewport.zoom,
    });
  }, [value, readonlyPolygons, width, height, points]);

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
          getPosition: (d) => [d.location.lng, d.location.lat],
          getFillColor: (d) => {
            if (!d.recordedAt) return [255, 140, 0, 200];
            const hour = new TZDate(d.recordedAt, d.timezone).getHours();
            return getHourColors(hour);
          },
          getLineColor: [255, 255, 255],
          lineWidthMinPixels: 1,
          onHover: (info) => {
            setHoverInfo(info.object ? info : null);
          },
        }),
      );

      l.push(
        new PathLayer({
          id: "movement-path",
          data: [
            {
              path: points.map((p) => [p.location.lng, p.location.lat]),
            },
          ],
          getPath: (d) => d.path,
          getWidth: 2,
          widthUnits: "pixels",
          getColor: [100, 149, 237, 200],
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
      >
        <MapLibre reuseMaps mapStyle="https://tiles.openfreemap.org/styles/bright" />
      </DeckGL>
      {hoverInfo && (
        <Popover opened withArrow position="right" withinPortal>
          <Popover.Target>
            <div
              style={{
                position: "relative",
                pointerEvents: "none",
                left: hoverInfo.x,
                top: hoverInfo.y,
                width: 0,
                height: 0,
              }}
            />
          </Popover.Target>

          <Popover.Dropdown>
            <Text size="sm">
              {hoverInfo.object.timezone
                ? format(new TZDate(hoverInfo.object.recordedAt, hoverInfo.object.timezone ?? ""), "dd/MM/yyyy HH:mm")
                : new Date(hoverInfo.object.recordedAt).toLocaleString()}
            </Text>
          </Popover.Dropdown>
        </Popover>
      )}
    </Box>
  );
}

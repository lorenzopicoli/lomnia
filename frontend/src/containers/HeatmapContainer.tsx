import { Skeleton } from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpc } from "../api/trpc";
import Heatmap from "../components/Heatmap/Heatmap";
import type MapViewParams from "../types/MapViewParams";

type HeatmapContainerProps = {
  startDate: Date;
  endDate: Date;
};

export default function HeatmapContainer(props: HeatmapContainerProps) {
  const [isFirstFetch, setIsFirstFetch] = useState(false);
  const [fitToBounds, setFitToBounds] = useState(true);
  const [mapViewParams, setMapViewParams] = useDebouncedState<MapViewParams>(
    {
      // There are PostGIS limitations. Ideally I'd like to check lng 180 to -180
      // I should just accept null for the first call maybe
      topLeftLat: 85,
      topLeftLng: -90,
      bottomRightLat: -85,
      bottomRightLng: 90,
      zoom: 10,
    },
    500,
  );

  const { startDate, endDate } = props;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFitToBounds(true);
    setIsFirstFetch(false);
  }, [props.startDate]);

  const { data } = useQuery(
    trpc.charts.locations.getHeatmap.queryOptions(
      {
        ...mapViewParams,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      {
        // Makes sure that data isn't undefined while new request is loading
        placeholderData: (prev) => prev,
      },
    ),
  );

  if (data && !isFirstFetch) {
    setIsFirstFetch(true);
  }

  const handleViewChange = (params: MapViewParams) => {
    setFitToBounds(false);
    setMapViewParams(params);
  };

  if (!isFirstFetch) {
    return <Skeleton h={"100%"} w={"100%"} />;
  }
  if (!data || data.length === 0) {
    return <Skeleton h={"100%"} w={"100%"} />;
  }

  return <Heatmap fitToBounds={fitToBounds} points={data} onViewChange={handleViewChange} />;
}

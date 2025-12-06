import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function PlacesVisitCountBar(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.locations.getVisitCountsByPlace.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const mapData = data
      .filter((d) => d.name)
      .map((d) => ({
        name: d.name,
        value: d.visits,
      }));

    return {
      tooltip: {
        trigger: "axis",
      },

      yAxis: {
        type: "value",
      },

      xAxis: {
        type: "category",
        data: mapData.map((d) => d.name),
      },

      series: [
        {
          colorBy: "data",

          type: "bar",
          name: "# of visits",
          data: mapData.map((d) => d.value),
        },
      ],
    };
  }, [data]);

  return <Echarts option={option} />;
}

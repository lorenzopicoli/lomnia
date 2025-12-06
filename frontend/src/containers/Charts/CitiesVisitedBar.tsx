import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatSeconds } from "../../utils/formatSeconds";
import { isNumber } from "../../utils/isNumber";

export function CitiesVisitedBar(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.locations.getCitiesVisited.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const mapData = data
      .filter((d) => d.city)
      .map((d) => ({
        name: d.city,
        value: d.timeSpentInSec,
      }));

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const sec = params[0].value;
          return `${params[0].name}: ${isNumber(sec) ? formatSeconds(sec) : "0s"}`;
        },
      },

      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => (isNumber(value) ? formatSeconds(value, ["years", "months", "days"]) : "0s"),
        },
      },

      xAxis: {
        type: "category",
        data: mapData.map((d) => d.name),
      },

      series: [
        {
          colorBy: "data",

          type: "bar",
          name: "Time Spent",
          data: mapData.map((d) => d.value),
        },
      ],
    };
  }, [data]);

  return <Echarts option={option} />;
}

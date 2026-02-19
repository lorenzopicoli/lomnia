import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatSeconds } from "../../utils/formatSeconds";
import { isNumber } from "../../utils/isNumber";

export function CitiesVisitedPie(props: ChartProps) {
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
        trigger: "item",
        formatter: (params: any) => {
          const sec = params.value;
          return `${params.name}: ${isNumber(sec) ? formatSeconds(sec) : "0s"}`;
        },
      },

      series: [
        {
          type: "pie",
          radius: "70%",
          colorBy: "data",
          data: mapData,
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

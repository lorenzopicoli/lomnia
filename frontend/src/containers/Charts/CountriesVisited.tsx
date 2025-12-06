import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { isNumber } from "../../utils/isNumber";

export function CountriesVisited(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.locations.getCountriesVisited.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const mapData = data
      .filter((d) => d.country)
      .map((d) => ({
        name: d.country,
        value: d.weight,
      }));

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => (isNumber(params.value) ? `${params.name}: ${params.value}` : `${params.name}: 0`),
      },

      visualMap: {
        min: 0,
        max: Math.max(...mapData.map((d) => d.value), 1),
        text: ["High", "Low"],
        realtime: false,
        calculable: true,
      },

      series: [
        {
          name: "Visited Countries",
          type: "map",
          map: "world",
          roam: false,
          emphasis: {
            label: { show: true },
            itemStyle: { borderWidth: 1.5 },
          },

          itemStyle: {
            areaColor: "transparent",
            borderColor: "#999",
          },
          data: mapData,
        },
      ],
    };
  }, [data]);

  return <Echarts option={option} />;
}

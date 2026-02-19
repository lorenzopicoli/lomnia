import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function MostVisitedHostsPie(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.browserHistory.getMostVisitedHosts.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const mapData = data.filter((d) => d.host);

    return {
      tooltip: {
        trigger: "item",
      },
      series: [
        {
          type: "pie",
          radius: "70%",
          colorBy: "data",
          label: {
            show: true,
            formatter: "{b}",
          },
          data: mapData.map((r) => ({
            value: r.visits,
            name: r.host,
          })),
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

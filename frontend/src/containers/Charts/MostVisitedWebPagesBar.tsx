import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function MostVisitedWebPagesBar(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.browserHistory.getMostVisitedPages.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const mapData = data.filter((d) => d.url);

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any[]) => {
          const p = params[0];
          const { title, url, value } = p.data;

          return `
        <strong>${title ?? url}</strong><br/>
        ${url}<br/>
        Visits: ${value}
      `;
        },
      },

      yAxis: {
        type: "value",
      },

      xAxis: {
        type: "category",
        data: mapData.map((d) => d.url),
      },

      series: [
        {
          colorBy: "data",

          type: "bar",
          name: "# of visits",
          data: mapData.map((d) => d.visits),
        },
      ],
    };
  }, [data]);

  return <Echarts option={option} />;
}

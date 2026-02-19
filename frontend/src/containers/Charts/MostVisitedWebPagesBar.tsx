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
          const { title, url } = p.data;

          return `
          <strong>${title ?? url}</strong><br/>
          ${url}<br/>
          Visits: ${p.value}
        `;
        },
      },

      xAxis: {
        type: "category",
        data: mapData.map((d) => d.url),
        axisLabel: {
          interval: 0,
          rotate: 30,
        },
      },

      yAxis: {
        type: "value",
      },

      series: [
        {
          type: "bar",
          name: "# of visits",
          colorBy: "data",
          data: mapData.map((d) => ({
            value: d.visits,
            title: d.title,
            url: d.url,
          })),
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

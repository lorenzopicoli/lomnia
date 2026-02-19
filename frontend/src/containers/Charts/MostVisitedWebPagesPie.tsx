import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function MostVisitedWebPagesPie(props: ChartProps) {
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
        trigger: "item",
        formatter: (p: any) => {
          const { title, url, value } = p.data;

          return `
          <strong>${title ?? url}</strong><br/>
          ${url}<br/>
          Visits: ${value}
        `;
        },
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
            name: r.url,
            title: r.title,
            url: r.url,
          })),
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

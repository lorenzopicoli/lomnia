import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function WebsiteNavigationFlowChord(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.browserHistory.websitesNavigationFlow.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    // If backend does NOT send distinct nodes, derive them:
    const nodes = Array.from(new Set([...data.map((l) => l.source), ...data.map((l) => l.target)]));

    return {
      tooltip: { trigger: "item" },
      legend: { show: false },

      series: [
        {
          type: "chord",
          clockwise: false,
          label: { show: true },

          lineStyle: {
            color: "target",
            opacity: 0.7,
          },

          data: nodes.map((name) => ({ name })),

          links: data.map((l) => ({
            source: l.source,
            target: l.target,
            value: l.weight,
          })),
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

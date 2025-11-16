import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { AggregationPeriod } from "../../charts/types";

export function HeartRateMinMaxAvg(props: { startDate: Date; endDate: Date; aggPeriod: AggregationPeriod }) {
  const { data } = useQuery(
    trpc.getHeartRateMinMaxAvg.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      period: props.aggPeriod,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    return {
      grid: { top: 40, right: 8, bottom: 24, left: 36 },

      xAxis: { type: "time" },
      yAxis: { type: "value" },

      tooltip: {
        trigger: "axis",
        formatter: (params: any[]) => {
          const t = new Date(params[0].value[0]).toLocaleString();

          const min = params.find((p) => p.seriesName === "Min")?.value[1];
          const max = params.find((p) => p.seriesName === "Max")?.value[1];
          const avg = params.find((p) => p.seriesName === "Median")?.value[1];

          return `
            <b>${t}</b><br/>
            Min: ${min}<br/>
            Median: ${avg.toFixed(1)}<br/>
            Max: ${max}
          `;
        },
      },

      series: [
        {
          name: "Max",
          type: "line",
          data: data.map((point) => [new Date(point.date), point.max]),
          smooth: true,
          symbol: "none",
          lineStyle: { width: 0 },
          areaStyle: { opacity: 0.25 },
        },
        {
          name: "Min",
          type: "line",
          data: data.map((point) => [new Date(point.date), point.min]),
          smooth: true,
          symbol: "none",
          lineStyle: { width: 0 },
          areaStyle: { opacity: 0.25 },
        },
        {
          name: "Median",
          type: "line",
          data: data.map((point) => [new Date(point.date), point.median]),
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2 },
        },
      ],

      legend: { top: 0 },
    };
  }, [data]);

  return <ReactECharts style={{ height: "100%" }} option={option} notMerge={true} lazyUpdate={true} />;
}

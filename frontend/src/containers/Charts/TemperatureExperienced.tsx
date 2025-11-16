import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { AggregationPeriod } from "../../charts/types";

export function TemperatureExperienced(props: { startDate: Date; endDate: Date; aggPeriod: AggregationPeriod }) {
  const { data } = useQuery(
    trpc.getWeatherCharts.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      xKey: "date",
      yKeys: ["apparentTemperature", "temperature2m"],
      aggregation: { fun: "avg", period: props.aggPeriod },
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const series = Object.entries(data.data).map(([key, points]) => ({
      name: key,
      type: "line",
      smooth: true,
      showSymbol: false,

      data: points.map((p) => [new Date(p.x), +p.y.toFixed(2)]),
    }));

    return {
      grid: { top: 40, right: 8, bottom: 24, left: 36 },

      xAxis: {
        type: "time",
      },

      yAxis: {
        type: "value",
        axisLabel: {
          formatter: "{value} °C",
        },
      },

      series,

      tooltip: {
        trigger: "axis",
      },

      legend: {
        top: 0,
      },
    };
  }, [data]);

  return <ReactECharts style={{ height: "100%" }} option={option} notMerge={true} lazyUpdate={true} />;
}

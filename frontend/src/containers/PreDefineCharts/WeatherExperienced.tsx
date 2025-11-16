import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";

export function WeatherExperienced(props: { startDate: Date; endDate: Date }) {
  const { data, isLoading } = useQuery(
    trpc.getWeatherCharts.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      xKey: "date",
      yKeys: ["apparentTemperature", "temperature2m"],
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const series = Object.entries(data.data).map(([key, points]) => ({
      name: key,
      type: "line",
      smooth: true,
      showSymbol: false,
      data: points.map((p) => [p.x, p.y]),
    }));

    return {
      grid: { top: 20, right: 8, bottom: 24, left: 36 },

      xAxis: {
        type: "category",
        boundaryGap: false,
      },

      yAxis: {
        type: "value",
        min: data.minY,
        max: data.maxY,
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

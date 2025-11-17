import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { AggregationPeriod } from "../../charts/types";
import { EchartsCommonConfig } from "./commonConfig";

export function PrecipitationExperienced(props: { startDate: Date; endDate: Date; aggPeriod: AggregationPeriod }) {
  const { data: precipitationData } = useQuery(
    trpc.getWeatherPrecipitation.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      period: props.aggPeriod,
    }),
  );

  const option: EChartsOption = useMemo(() => {
    if (!precipitationData) return {};

    const dates = precipitationData.map((p) => new Date(p.date));
    const rain = precipitationData.map((p) => p.rainSum);
    const snow = precipitationData.map((p) => p.snowfallSum);

    return {
      tooltip: {
        ...EchartsCommonConfig.tooltip,
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<Date, number>(
          ["Rain", "Snow"],
          (x) => x.toDateString(),
          (y, series) => {
            const formattedY = y.toFixed(1);
            switch (series) {
              case "Rain":
                return `🌧 Rain: ${formattedY} mm`;
              case "Snow":
                return `❄️ Snow ${formattedY} mm`;
              default:
                return "";
            }
          },
          (_x, ys) => {
            const sum = ys.reduce((acc, cur) => acc + cur, 0).toFixed(1);
            return `<b>Total: ${sum} mm</b>`;
          },
        ),
      },

      color: ["#4A90E2", "#BBD4F1"],

      legend: EchartsCommonConfig.legend,
      grid: EchartsCommonConfig.grid,
      xAxis: EchartsCommonConfig.timeXAxis,

      yAxis: {
        ...EchartsCommonConfig.valueYAxis,
        splitLine: EchartsCommonConfig.splitLine,
        name: "mm",
      },

      series: [
        {
          name: "Rain",
          type: "bar",
          stack: "precip",
          data: dates.map((d, i) => [d, rain[i]]),
          itemStyle: {
            ...EchartsCommonConfig.roundedBar,
            opacity: 0.9,
          },
        },
        {
          name: "Snow",
          type: "bar",
          stack: "precip",
          data: dates.map((d, i) => [d, snow[i]]),
          itemStyle: {
            ...EchartsCommonConfig.roundedBar,
            opacity: 0.85,
          },
        },
      ],
    };
  }, [precipitationData]);

  return <ReactECharts style={{ height: "100%", width: "100%" }} option={option} notMerge lazyUpdate />;
}

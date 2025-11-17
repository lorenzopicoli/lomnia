import { useMantineTheme } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { AggregationPeriod } from "../../charts/types";
import { EchartsCommonConfig } from "./commonConfig";

export function TemperatureExperienced(props: { startDate: Date; endDate: Date; aggPeriod: AggregationPeriod }) {
  const theme = useMantineTheme();
  const { data } = useQuery(
    trpc.getWeatherApparentVsActual.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      period: props.aggPeriod,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const dates = data.map((p) => new Date(p.date));
    const apparentTemps = data.map((p) => p.apparentTemp);
    const actualTemps = data.map((p) => p.actualTemp);

    const hotDiff: number[] = [];
    const coldDiff: number[] = [];
    apparentTemps.forEach((apparent, i) => {
      const actual = actualTemps[i];
      if (apparent > actual) {
        hotDiff[i] = apparent - actual;
        coldDiff[i] = 0;
      } else if (apparent < actual) {
        coldDiff[i] = -Math.abs(actual - apparent);
        hotDiff[i] = 0;
      }
    });

    return {
      grid: EchartsCommonConfig.grid,
      xAxis: EchartsCommonConfig.timeXAxis,

      yAxis: {
        ...EchartsCommonConfig.valueYAxis,
        splitLine: EchartsCommonConfig.splitLine,
        axisLabel: {
          ...EchartsCommonConfig.axisLabel,
          formatter: "{value} °C",
        },
      },

      tooltip: { trigger: "axis" },
      legend: EchartsCommonConfig.legend,

      series: [
        {
          name: "Actual Temperature",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: dates.map((d, i) => [d, actualTemps[i]]),
          lineStyle: { width: 1.5 },
          itemStyle: {
            opacity: 0,
          },
        },
        {
          name: "Feels Hotter",
          type: "line",
          data: dates.map((d, i) => [d, hotDiff[i]]),
          smooth: true,
          symbol: "none",
          lineStyle: {
            opacity: 0,
            color: "#ff9b45",
          },
          itemStyle: {
            color: "#ff9b45",
          },
          areaStyle: {
            color: "#ff9b45",
            opacity: 0.5,
          },
        },
        {
          name: "Feels Colder",
          type: "line",
          data: dates.map((d, i) => [d, coldDiff[i]]),
          symbol: "none",
          smooth: true,
          lineStyle: {
            opacity: 0,
            color: "#4a9bf3",
          },
          itemStyle: {
            color: "#4a9bf3",
          },
          areaStyle: {
            color: "#4a9bf3",
            opacity: 0.5,
          },
        },

        {
          name: "Apparent Temperature",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: dates.map((d, i) => [d, apparentTemps[i]]),
          lineStyle: { width: 1.5 },
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    };
  }, [data]);

  return <ReactECharts style={{ height: "100%" }} option={option} notMerge={true} lazyUpdate={true} />;
}

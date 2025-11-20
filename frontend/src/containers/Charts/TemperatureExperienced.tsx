import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function TemperatureExperienced(props: ChartProps) {
  const { data } = useQuery(
    trpc.charts.weather.getApparentVsActualTemp.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      aggregationPeriod: props.aggPeriod,
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
      xAxis: {
        type: "time",
      },
      yAxis: {
        axisLabel: {
          formatter: "{value} °C",
        },
      },

      tooltip: {
        trigger: "axis",

        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<Date, number>(
          ["Apparent Temperature", "Actual Temperature", "Feels Hotter", "Feels Colder"],
          (x) => x.toDateString(),
          (y, series) => {
            switch (series) {
              case "Apparent Temperature": {
                const formattedY = y.toFixed(0);
                return `Apparent: <b>${formattedY}°C</b>`;
              }
              case "Actual Temperature": {
                const formattedY = y.toFixed(0);
                return `Actual: <b>${formattedY}°C</b>`;
              }
              case "Feels Hotter": {
                const formattedY = +y.toFixed(2);
                return formattedY !== 0 ? `Feels <b>${formattedY}°C</b> hotter` : "";
              }
              case "Feels Colder": {
                const formattedY = +y.toFixed(2) * -1;
                return formattedY !== 0 ? `Feels <b>${formattedY}°C</b> colder` : "";
              }
              default:
                return "";
            }
          },
        ),
      },
      series: [
        {
          name: "Apparent Temperature",
          type: "line",
          data: dates.map((d, i) => [d, apparentTemps[i]]),
        },
        {
          name: "Actual Temperature",
          type: "line",
          data: dates.map((d, i) => [d, actualTemps[i]]),
        },
        {
          name: "Feels Hotter",
          type: "line",
          data: dates.map((d, i) => [d, hotDiff[i]]),
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
      ],
    };
  }, [data]);

  return (
    <ReactECharts theme={"default_dark"} style={{ height: "100%" }} option={option} notMerge={true} lazyUpdate={true} />
  );
}

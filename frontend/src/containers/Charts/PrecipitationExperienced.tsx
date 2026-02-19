import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function PrecipitationExperienced(props: ChartProps) {
  const { data: precipitationData } = useQuery(
    trpc.charts.weather.getDailyPrecipitation.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      aggregationPeriod: props.aggPeriod,
    }),
  );

  const option: EChartsOption = useMemo(() => {
    if (!precipitationData) return {};

    const dates = precipitationData.map((p) => new Date(p.date));
    const rain = precipitationData.map((p) => p.rainSum);
    const snow = precipitationData.map((p) => p.snowfallSum);

    return {
      tooltip: {
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<Date, number>(
          ["Rain", "Snow"],
          (x) => x.toDateString(),
          (y, series) => {
            if (y === 0) {
              return "";
            }
            const formattedY = y.toFixed(1);
            switch (series) {
              case "Rain":
                return `Rain: <b>${formattedY}mm</b>`;
              case "Snow":
                return `Snow <b>${formattedY}mm</b>`;
              default:
                return "";
            }
          },
          (_x, ys) => {
            const sum = ys.reduce((acc, cur) => acc + cur, 0).toFixed(1);
            if (ys.filter((y) => y > 0).length <= 1) {
              return "";
            }
            return `<b>Total: ${sum} mm</b>`;
          },
        ),
      },

      color: [EchartsCommonConfig.colors.rain, EchartsCommonConfig.colors.snow],

      xAxis: {
        type: "time",
      },

      yAxis: {
        axisLabel: {
          formatter: "{value}mm",
        },
      },

      series: [
        {
          name: "Rain",
          type: "bar",
          stack: "precip",
          data: dates.map((d, i) => [d, rain[i]]),
          itemStyle: EchartsCommonConfig.roundedBar,
        },
        {
          name: "Snow",
          type: "bar",
          stack: "precip",
          data: dates.map((d, i) => [d, snow[i]]),
          itemStyle: EchartsCommonConfig.roundedBar,
        },
      ],
    };
  }, [precipitationData]);

  return <Echarts title={props.title} option={option} />;
}

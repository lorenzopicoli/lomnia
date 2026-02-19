import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { HabitChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { EchartsThemes } from "../../themes/echartsThemes";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function NumberHabitLine(props: HabitChartProps) {
  const { data } = useQuery(
    trpc.charts.habits.numeric.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      aggregation: {
        period: props.aggPeriod ?? "day",
        function: props.aggFun ?? "sum",
      },
      habitKey: props.habitKey,
    }),
  );
  const color = pickColor(props.title ?? "", EchartsThemes.darkDefault.color);

  const option = useMemo(() => {
    if (!data) return {};

    const dates = data.map((p) => new Date(p.date));
    const values = data.map((p) => p.value);

    return {
      xAxis: {
        type: "time",
      },
      yAxis: {
        axisLabel: {
          formatter: "{value}",
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<Date, number>(
          ["Value"],
          (x) => x.toDateString(),
          (y) => `<b>${y}</b>`,
        ),
      },
      series: [
        {
          name: "Value",
          type: "line",
          data: dates.map((d, i) => [d, values[i]]),
          showSymbol: false,
          smooth: false,
          lineStyle: { color },
          itemStyle: { color },
        },
      ],
    };
  }, [data, color]);

  return <Echarts title={props.title} option={option} />;
}

function pickColor(key: string, colors: string[]) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

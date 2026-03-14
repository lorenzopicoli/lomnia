import { useQuery } from "@tanstack/react-query";
import type { DurationUnit } from "date-fns";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ExerciseChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatSeconds } from "../../utils/formatSeconds";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function ExerciseDurationLine(props: ExerciseChartProps) {
  const { data } = useQuery(
    trpc.charts.exercise.durations.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      aggregation: {
        period: props.aggPeriod,
        function: props.aggFun ?? "max",
      },
      exerciseKey: props.exerciseKey,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};
    const format: DurationUnit[] = ["hours", "minutes"];
    return {
      xAxis: {
        type: "time",
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) => formatSeconds(value, format),
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<Date, number>(
          ["Duration"],
          (x) => x.toDateString(),
          (y) => `<b>${formatSeconds(y, format)}</b>`,
        ),
      },
      series: [
        {
          name: "Duration",
          type: "line",
          data: data.map((d) => [new Date(d.date), d.value]),
          showSymbol: false,
          smooth: true,
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ExerciseChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatDistance } from "../../utils/formatDistance";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function ExerciseDistanceLine(props: ExerciseChartProps) {
  const { data } = useQuery(
    trpc.charts.exercise.distances.queryOptions({
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
    return {
      xAxis: {
        type: "time",
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) => formatDistance(value),
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: EchartsCommonConfig.dateNumberSeriesFormatter<Date, number>(
          ["Distance"],
          (x) => x.toDateString(),
          (y) => `<b>${formatDistance(y)}</b>`,
        ),
      },
      series: [
        {
          name: "Distance",
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

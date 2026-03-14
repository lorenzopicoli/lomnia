import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ExerciseChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatPace } from "../../utils/formatPace";

export function ExercisePaceTemperatureScatter(props: ExerciseChartProps) {
  const { data } = useQuery(
    trpc.charts.exercise.averagePacePerTemperature.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      exerciseKey: props.exerciseKey,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const points = data.map((d) => [d.temp, Number(d.pace), d.count]);

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const [temp, pace, count] = params.value;
          return `
            Temp: ${temp}°C<br/>
            Pace: ${formatPace(pace)}<br/>
            Samples: ${count}
          `;
        },
      },

      xAxis: {
        type: "value",
        name: "Temperature (°C)",
      },

      yAxis: {
        type: "value",
        name: "Pace (min/km)",
      },

      series: [
        {
          type: "scatter",
          symbolSize: (val: number[]) => Math.sqrt(val[2]) * 4,
          data: points,
        },
      ],
    };
  }, [data]);

  return <Echarts title={props.title} option={option} />;
}

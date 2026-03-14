import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ExerciseChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";
import { formatPace } from "../../utils/formatPace";

export function ExerciseFastestLapsBar(props: ExerciseChartProps) {
  const { data } = useQuery(
    trpc.charts.exercise.fastestLaps.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      exerciseKey: props.exerciseKey,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const paces = data.map((d) => d.pace ?? 0);
    const min = Math.min(...paces);
    const max = Math.max(...paces);

    return {
      visualMap: {
        show: false,
        min,
        max,
        dimension: 0,
        inRange: {
          color: ["#7f1d1d", "#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#93c5fd"],
        },
      },

      xAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatPace(value),
        },
        name: "Pace",
      },

      yAxis: {
        type: "category",
        inverse: true,
        data: data.map((_, i) => `#${i + 1}`),
      },

      tooltip: {
        trigger: "item",
        formatter: (p: any) => {
          const d = p.data.raw;
          return `
          ${new Date(d.date).toDateString()}<br/>
          Pace: <b>${formatPace(d.pace)}</b>
        `;
        },
      },

      series: [
        {
          type: "bar",
          data: data.map((d) => ({
            value: d.pace,
            raw: d,
          })),
          label: {
            show: true,
            formatter: (p: any) => p.data.raw.name,
          },
        },
      ],
    };
  }, [data]);
  return <Echarts title={props.title} option={option} />;
}

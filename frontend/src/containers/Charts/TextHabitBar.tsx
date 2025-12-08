import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { HabitChartProps } from "../../charts/types";
import { Echarts } from "../../components/Echarts/Echarts";

export function TextHabitBar(props: HabitChartProps) {
  const { data } = useQuery(
    trpc.charts.habits.textGroup.queryOptions({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      habitKey: props.habitKey,
    }),
  );

  const option = useMemo(() => {
    if (!data) return {};

    const mapData = data
      .filter((d) => d.value)
      .map((d) => ({
        name: d.value,
        value: d.count,
      }));

    return {
      tooltip: {
        trigger: "axis",
      },

      yAxis: {
        type: "value",
      },

      xAxis: {
        type: "category",
        data: mapData.map((d) => d.name),
        axisLabel: {
          interval: 0,
          rotate: 45,
        },
      },

      series: [
        {
          colorBy: "data",

          type: "bar",
          name: "Values",
          data: mapData.map((d) => d.value),
        },
      ],
    };
  }, [data]);

  return <Echarts option={option} />;
}

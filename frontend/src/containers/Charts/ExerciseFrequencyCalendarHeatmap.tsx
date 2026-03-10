import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ExerciseChartProps } from "../../charts/types";
import { CalendarHeatmap } from "../../components/CalendarHeatmap/CalendarHeatmap";
import { getCalendarHeatmapSafeDates } from "../../utils/heatmapChartHelpers";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function ExerciseFrequencyCalendarHeatmap(props: ExerciseChartProps) {
  const { startDate, endDate } = getCalendarHeatmapSafeDates(props);
  const { data } = useQuery(
    trpc.charts.exercise.frequency.queryOptions({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      aggregation: {
        period: "day",
        function: props.aggFun ?? "sum",
      },
      exerciseKey: props.exerciseKey,
    }),
  );
  const formattedData = useMemo(
    () =>
      data?.reduce(
        (prev, curr) => {
          if (curr.frequency > 0) {
            prev[format(new Date(curr.date), "yyyy-MM-dd")] = curr.frequency;
          }
          return prev;
        },
        {} as Record<string, number>,
      ),
    [data?.reduce],
  );

  return (
    <CalendarHeatmap
      data={formattedData ?? {}}
      startDate={startDate}
      endDate={endDate}
      colors={EchartsCommonConfig.colorSteps.generic}
      gap={5}
      getTooltipLabel={({ date, value }) => `${date} – ${value ?? 0}`}
      splitMonths
    />
  );
}

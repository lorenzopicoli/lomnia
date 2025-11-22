import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { CalendarHeatmap } from "../../components/CalendarHeatmap/CalendarHeatmap";
import { getCalendarHeatmapSafeDates } from "../../utils/heatmapChartHelpers";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function RainHeatmap(props: ChartProps) {
  const { startDate, endDate } = getCalendarHeatmapSafeDates(props);
  const { data } = useQuery(
    trpc.charts.weather.getDailyPrecipitation.queryOptions({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      aggregationPeriod: "day",
    }),
  );
  const formattedData = useMemo(
    () =>
      data?.reduce(
        (prev, curr) => {
          if (curr.rainSum > 0.2) {
            prev[format(new Date(curr.date), "yyyy-MM-dd")] = curr.rainSum;
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
      colors={EchartsCommonConfig.colorSteps.rain}
      gap={5}
      getTooltipLabel={({ date, value }) => `${date} – ${value ?? 0}mm`}
      splitMonths
    />
  );
}

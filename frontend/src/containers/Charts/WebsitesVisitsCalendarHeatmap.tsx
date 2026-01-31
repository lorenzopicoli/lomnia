import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { ChartProps } from "../../charts/types";
import { CalendarHeatmap } from "../../components/CalendarHeatmap/CalendarHeatmap";
import { getCalendarHeatmapSafeDates } from "../../utils/heatmapChartHelpers";
import { EchartsCommonConfig } from "./EchartsCommonConfig";

export function WebsitesVisitsCalendarHeatmap(props: ChartProps) {
  const { startDate, endDate } = getCalendarHeatmapSafeDates(props);
  const { data } = useQuery(
    trpc.charts.browserHistory.dailyVisits.queryOptions({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }),
  );
  const formattedData = useMemo(
    () =>
      data?.reduce(
        (prev, curr) => {
          if (curr.visits > 0) {
            prev[format(new Date(curr.day), "yyyy-MM-dd")] = curr.visits;
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
      getTooltipLabel={({ date, value }) => `${date} – ${value ?? 0} visits`}
      splitMonths
    />
  );
}

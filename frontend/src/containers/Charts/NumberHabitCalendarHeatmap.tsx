import { Container } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { HabitChartProps } from "../../charts/types";
import { CalendarHeatmap } from "../../components/CalendarHeatmap/CalendarHeatmap";
import { getCalendarHeatmapSafeDates } from "../../utils/heatmapChartHelpers";
import { EchartsCommonConfig } from "./commonConfig";

export function NumberHabitCalendarHeatmap(props: HabitChartProps) {
  const { startDate, endDate } = getCalendarHeatmapSafeDates(props);
  const { data } = useQuery(
    trpc.getNumberHabit.queryOptions({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period: "day",
      habitKey: props.habitKey,
    }),
  );
  const formattedData = useMemo(
    () =>
      data?.reduce(
        (prev, curr) => {
          if (curr.value > 0) {
            prev[format(new Date(curr.date), "yyyy-MM-dd")] = curr.value;
          }
          return prev;
        },
        {} as Record<string, number>,
      ),
    [data?.reduce],
  );

  return (
    <Container fluid h={"100%"}>
      {props.title}
      <CalendarHeatmap
        data={formattedData ?? {}}
        startDate={startDate}
        endDate={endDate}
        colors={EchartsCommonConfig.colorSteps.generic}
        gap={5}
        getTooltipLabel={({ date, value }) => `${date} – ${value ?? 0}`}
        splitMonths
      />
    </Container>
  );
}

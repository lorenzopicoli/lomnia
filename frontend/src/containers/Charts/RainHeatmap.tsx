import { Heatmap } from "@mantine/charts";
import { Container, Flex } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { trpc } from "../../api/trpc";
import type { AggregationPeriod } from "../../charts/types";
import { calculateHeatmapChartRectSize } from "../../utils/calculateHeatmapChartRectSize";
import { EchartsCommonConfig } from "./commonConfig";

export function RainHeatmap(props: { startDate: Date; endDate: Date; aggPeriod: AggregationPeriod }) {
  const { data } = useQuery(
    trpc.getWeatherPrecipitation.queryOptions({
      startDate: props.startDate.toISOString(),
      endDate: props.endDate.toISOString(),
      period: "day",
    }),
  );
  const { ref, width, height } = useElementSize();
  const gap = 5;
  const rectSize = useMemo(
    () =>
      calculateHeatmapChartRectSize({
        startDate: props.startDate,
        endDate: props.endDate,
        width,
        height,
        gap,
      }),
    [props.startDate, props.endDate, width, height],
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
    <Flex align={"center"} justify={"center"} component={Container} flex={1} fluid ref={ref} w={"100%"} h={"100%"}>
      <Heatmap
        data={formattedData ?? {}}
        colors={EchartsCommonConfig.colorSteps.rain}
        // rectRadius={rectSize / 2}
        gap={gap}
        rectSize={rectSize}
        startDate={props.startDate}
        endDate={props.endDate}
        withOutsideDates={false}
        withTooltip
        // splitMonths
        getTooltipLabel={({ date, value }) => `${date} – ${value ?? 0}mm`}
        withMonthLabels
        withWeekdayLabels
      />
    </Flex>
  );
}

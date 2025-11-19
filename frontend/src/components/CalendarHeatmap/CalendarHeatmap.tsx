import { Heatmap, type HeatmapProps } from "@mantine/charts";
import { Container, Flex } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { max } from "date-fns";
import { subYears } from "date-fns/subYears";
import { useMemo } from "react";
import { calculateHeatmapChartRectSize } from "../../utils/heatmapChartHelpers";

export interface CalendarHeatmapProps extends HeatmapProps {
  startDate: Date;
  endDate: Date;
}

export function CalendarHeatmap(props: CalendarHeatmapProps) {
  const safeStart = max([subYears(props.endDate, 1), props.startDate]);
  // const [splitMonths, setSplitMonths] = useState(props.splitMonths ?? false);
  const { ref, width, height } = useElementSize();
  const gap = props.gap ?? 0;
  const RECT_THRESHOLD_OVERRIDE_SPLIT = 7;
  const { rectSize, safeSplitMonths } = useMemo(() => {
    const preferredRectSize = calculateHeatmapChartRectSize({
      startDate: safeStart,
      endDate: props.endDate,
      width,
      height,
      gap,
      splitMonths: props.splitMonths ?? false,
    });

    if (preferredRectSize < RECT_THRESHOLD_OVERRIDE_SPLIT) {
      const smallerRectSize = calculateHeatmapChartRectSize({
        startDate: safeStart,
        endDate: props.endDate,
        width,
        height,
        gap,
        splitMonths: false,
      });
      return { rectSize: smallerRectSize, safeSplitMonths: false };
    }

    return { rectSize: preferredRectSize, safeSplitMonths: props.splitMonths };
  }, [props.endDate, width, height, safeStart, gap, props.splitMonths]);

  return (
    <Flex align={"center"} justify={"center"} component={Container} flex={1} fluid ref={ref} w={"100%"} h={"100%"}>
      <Heatmap
        gap={gap}
        rectSize={rectSize}
        withOutsideDates={false}
        withTooltip
        withMonthLabels
        withWeekdayLabels
        {...props}
        splitMonths={safeSplitMonths}
        startDate={safeStart}
        endDate={props.endDate}
      />
    </Flex>
  );
}

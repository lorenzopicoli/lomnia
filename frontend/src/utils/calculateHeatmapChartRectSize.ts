import { differenceInCalendarWeeks } from "date-fns";

export function calculateHeatmapChartRectSize(params: {
  startDate: Date;
  endDate: Date;
  width: number;
  height: number;
  gap: number;
}) {
  const { startDate, endDate, width, height, gap } = params;
  const weeks = differenceInCalendarWeeks(endDate, startDate) + 1;

  const horizontalMargins = 100;
  const vertialMargins = 25;
  const safeWidth = Math.max(width - horizontalMargins, 1);
  const safeHeight = Math.max(height - vertialMargins, 1);

  const rectSizeWidth = (safeWidth - weeks * gap) / weeks;

  const rectSizeHeight = (safeHeight - 6 * gap) / 7;

  return Math.max(0, Math.min(rectSizeWidth, rectSizeHeight));
}

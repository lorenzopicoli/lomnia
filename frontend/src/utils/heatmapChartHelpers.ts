import { differenceInCalendarWeeks, max } from "date-fns";
import { differenceInCalendarMonths } from "date-fns/differenceInCalendarMonths";
import { subYears } from "date-fns/subYears";

export function calculateHeatmapChartRectSize(params: {
  startDate: Date;
  endDate: Date;
  width: number;
  height: number;
  gap: number;
  splitMonths: boolean;
}) {
  const { startDate, endDate, width, height, gap } = params;
  const _weeks = differenceInCalendarWeeks(endDate, startDate) + 1;
  const months = differenceInCalendarMonths(endDate, startDate) + 1;

  const weeks = params.splitMonths ? months * 2 + _weeks - 5 : _weeks;

  const horizontalMargins = params.splitMonths ? 100 : 80;
  const vertialMargins = 25;
  const safeWidth = Math.max(width - horizontalMargins, 1);
  const safeHeight = Math.max(height - vertialMargins, 1);

  const rectSizeWidth = (safeWidth - weeks * gap) / weeks;

  const rectSizeHeight = (safeHeight - 6 * gap) / 7;

  return Math.max(0, Math.min(rectSizeWidth, rectSizeHeight));
}

export function getCalendarHeatmapSafeDates(params: { startDate: Date; endDate: Date }) {
  const startDate = max([subYears(params.endDate, 1), params.startDate]);
  return { startDate, endDate: params.endDate };
}

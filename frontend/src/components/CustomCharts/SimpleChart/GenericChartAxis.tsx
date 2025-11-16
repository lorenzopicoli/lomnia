import { useMantineTheme } from "@mantine/core";
import { AxisBottom, AxisLeft } from "@visx/axis";
import type { AxisProps } from "@visx/axis/lib/axis/Axis";
import { format, isDate } from "date-fns";
import { unitToLabel } from "../../../charts/charts";
import type { ChartScale } from "../../../charts/types";
import { isNumber } from "../../../utils/isNumber";
import type { GenericChartProps } from "./GenericChartTypes";

export type GenericChartAxisProps = {
  xScale: ChartScale;
  yScale: ChartScale;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainChart: GenericChartProps<any>;
};
export function GenericChartAxis({ xScale, yScale, height, margin, mainChart }: GenericChartAxisProps) {
  const theme = useMantineTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickProps: AxisProps<any>["tickLabelProps"] = {
    fill: theme.colors.dark[0],
    fontSize: 13,
  };
  const axisColor = theme.colors.dark[0];
  return (
    <>
      <AxisBottom
        top={height - margin.top - margin.bottom}
        scale={xScale.scale}
        stroke={axisColor}
        tickLabelProps={tickProps}
        tickFormat={(v) => {
          const unit = unitToLabel(mainChart.axis.x.unit);
          if (isNumber(v)) {
            return `${v.toFixed(2)}${unit ? " " : ""}${unit}`;
          }
          if (isDate(v)) {
            return format(v, "MMM dd");
          }
          console.log("Non number/date value in AxisBottom");
          return "";
        }}
      />
      <AxisLeft
        tickFormat={(v) => {
          const unit = unitToLabel(mainChart.axis.y.unit);
          return `${v}${unit ? " " : ""}${unit}`;
        }}
        stroke={axisColor}
        tickLabelProps={tickProps}
        left={margin.left}
        scale={yScale.scale}
      />
    </>
  );
}

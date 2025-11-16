import { GridColumns, GridRows } from "@visx/grid";
import type { ChartScale } from "../../../charts/types";

export type GenericChartGridsProps = {
  xScale: ChartScale;
  yScale: ChartScale;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
};
export function GenericChartGrids({ xScale, yScale, width, height, margin }: GenericChartGridsProps) {
  return (
    <>
      <GridRows
        scale={yScale.scale}
        left={margin.left}
        width={width - margin.left - margin.right}
        height={height - margin.top - margin.bottom}
        stroke="#e0e0e0"
        opacity={0.1}
      />
      <GridColumns
        scale={xScale.scale}
        width={width - margin.left - margin.right}
        height={height - margin.top - margin.bottom}
        stroke="#e0e0e0"
        opacity={0.1}
      />
    </>
  );
}

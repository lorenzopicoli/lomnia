import { GridColumns, GridRows } from '@visx/grid'
import type { AnyD3Scale } from '@visx/scale'

export type GenericChartGridsProps = {
  xScale: AnyD3Scale
  yScale: AnyD3Scale
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
}
export function GenericChartGrids({
  xScale,
  yScale,
  width,
  height,
  margin,
}: GenericChartGridsProps) {
  return (
    <>
      <GridRows
        scale={yScale}
        left={margin.left}
        width={width - margin.left - margin.right}
        height={height - margin.top - margin.bottom}
        stroke="#e0e0e0"
        opacity={0.1}
      />
      <GridColumns
        scale={xScale}
        width={width - margin.left - margin.right}
        height={height - margin.top - margin.bottom}
        stroke="#e0e0e0"
        opacity={0.1}
      />
    </>
  )
}

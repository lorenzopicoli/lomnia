import { Group } from '@visx/group'
import { ParentSize } from '@visx/responsive'
import { scaleLinear, scaleTime } from '@visx/scale'
import { LinePath } from '@visx/shape'
import * as allCurves from '@visx/curve'
import { useRef } from 'react'
import { GridColumns, GridRows } from '@visx/grid'

type SupportedScales =
  | ReturnType<typeof scaleTime<number>>
  | ReturnType<typeof scaleLinear<number>>

export type SingleSourceLineChartProps<T> = {
  xScale: SupportedScales
  yScale: SupportedScales
  data: T[]
  lines: {
    getX: (data: T) => Date
    getY: (data: T) => number
  }[]
}

type InternalSingleSourceLineChartsProps<T> = SingleSourceLineChartProps<T> & {
  width: number
  height: number
}
function SingleSourceLineChartInternal<T>(
  props: InternalSingleSourceLineChartsProps<T>
) {
  const {
    data,
    lines,
    xScale,
    yScale,
    // getX,
    // getY,
    width: totalWidth,
    height: totalHeight,
  } = props
  const margin = { top: 40, right: 30, bottom: 50, left: 40 }
  const innerWidth = totalWidth - margin.left - margin.right
  const innerHeight = totalHeight - margin.top - margin.bottom
  //   const heightPerLine = innerHeight / lines.length

  const svgRef = useRef<SVGSVGElement>(null)

  //   const {
  //     tooltipData,
  //     tooltipLeft,
  //     tooltipTop,
  //     tooltipOpen,
  //     showTooltip,
  //     hideTooltip,
  //   } = useTooltip<T>()

  // update scale output ranges
  xScale.range([0, innerWidth])
  yScale.range([innerHeight, 0])

  return (
    <svg width={totalWidth} height={totalHeight} ref={svgRef}>
      {/* Background rect */}
      <rect
        width={totalWidth}
        height={totalHeight}
        fill="#efefef"
        rx={14}
        ry={14}
        // onMouseMove={handleMouseMove}
        // onMouseLeave={handleMouseLeave}
        // onTouchMove={handleMouseMove}
        // onTouchEnd={handleMouseLeave}
      />
      <Group pointerEvents="none" left={margin.left} top={margin.top}>
        <GridRows
          scale={yScale}
          width={innerWidth}
          height={innerHeight}
          stroke="#e0e0e0"
        />
        <GridColumns
          scale={xScale}
          width={innerWidth}
          height={innerHeight}
          stroke="#e0e0e0"
        />
      </Group>
      {lines.map((lineData, i) => {
        const even = i % 2 === 0
        return (
          <Group
            key={`lines-${i}`}
            pointerEvents="none"
            left={margin.left}
            top={margin.top}
          >
            {data.map((d, j) => (
              <circle
                key={i + j}
                r={3}
                cx={xScale(lineData.getX(d))}
                cy={yScale(lineData.getY(d))}
                stroke="rgba(33,33,33,0.5)"
                fill="transparent"
                onFocus={() => true}
                onBlur={() => true}
              />
            ))}
            <LinePath<T>
              curve={allCurves.curveMonotoneX}
              data={data}
              x={(d) => xScale(lineData.getX(d)) ?? 0}
              y={(d) => yScale(lineData.getY(d)) ?? 0}
              stroke="#333"
              strokeWidth={even ? 2 : 1}
              strokeOpacity={even ? 0.6 : 1}
              shapeRendering="geometricPrecision"
              markerMid="url(#marker-circle)"
            />
          </Group>
        )
      })}
    </svg>
  )
}

export function SingleSourceLineChart<T>(props: SingleSourceLineChartProps<T>) {
  return (
    <ParentSize debounceTime={10}>
      {({ width, height }) => (
        <SingleSourceLineChartInternal
          {...props}
          height={height}
          width={width}
        />
      )}
    </ParentSize>
  )
}

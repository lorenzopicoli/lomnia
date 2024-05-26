import { ParentSize } from '@visx/responsive'
// import { scaleLinear, scaleTime } from '@visx/scale'
import * as allCurves from '@visx/curve'
import { Annotation, Axis, LineSeries, Tooltip, XYChart } from '@visx/xychart'
import { format } from 'date-fns/format'
import { CircleSubject, Connector, Label } from '@visx/annotation'
import { useMantineTheme } from '@mantine/core'

// type SupportedScales =
//   | ReturnType<typeof scaleTime<number>>
//   | ReturnType<typeof scaleLinear<number>>

export type SingleSourceLineChartProps<T> = {
  data: T[]
  lines: {
    id: string
    getX: (data: T) => Date
    getY: (data: T) => number
    max: T
    min: T
    showMinLabel: boolean
    showMaxLabel: boolean
    labels: {
      maxLabel: (
        data: T,
        unit: string,
        getX: (data: T) => Date,
        getY: (data: T) => number
      ) => string
      minLabel: (
        data: T,
        unit: string,
        getX: (data: T) => Date,
        getY: (data: T) => number
      ) => string
      unit: string
    }
  }[]
}

type InternalSingleSourceLineChartsProps<T> = SingleSourceLineChartProps<T> & {
  width: number
  height: number
}
function SingleSourceLineChartInternal<T extends object>(
  props: InternalSingleSourceLineChartsProps<T>
) {
  const { data, lines, width: totalWidth, height: totalHeight } = props
  const theme = useMantineTheme()
  const margin = { top: 40, right: 30, bottom: 50, left: 40 }

  return (
    <XYChart margin={margin} height={totalHeight} width={totalWidth}>
      <rect
        width={totalWidth}
        height={totalHeight}
        fill={theme.colors.dark[8]}
        rx={4}
        ry={4}
        // onMouseMove={handleMouseMove}
        // onMouseLeave={handleMouseLeave}
        // onTouchMove={handleMouseMove}
        // onTouchEnd={handleMouseLeave}
      />

      {lines.map((lineData, i) => {
        return (
          <>
            <LineSeries
              dataKey={lineData.id}
              data={data}
              xAccessor={lineData.getX}
              yAccessor={lineData.getY}
              curve={allCurves.curveMonotoneX}
              stroke={theme.colors.violet[4]}
              filter="url(#neon)"
            />
            <Tooltip<T>
              offsetTop={i * 50}
              showVerticalCrosshair
              snapTooltipToDatumX
              snapTooltipToDatumY
              renderTooltip={({ tooltipData }) => (
                <>
                  <div style={{ color: '#000' }}>{lineData.id}</div>
                  <br />
                  {format(
                    lineData.getX(tooltipData!.datumByKey[lineData.id].datum),
                    'PP p'
                  )}
                  :{' '}
                  {lineData
                    .getY(tooltipData!.datumByKey[lineData.id].datum)
                    .toFixed(2)}
                  {lineData.labels.unit}
                </>
              )}
            />
          </>
        )
      })}

      {lines.map((lineData, i) => {
        return (
          <>
            {lineData.showMaxLabel ? (
              <Annotation
                dx={i % 2 === 0 ? 100 : -100}
                dy={i * 50}
                dataKey={lineData.id}
                datum={lineData.max}
              >
                <Connector stroke="#efefef" type="elbow" />
                <CircleSubject stroke="#efefef" radius={10} />
                <Label
                  maxWidth={200}
                  backgroundFill="#efefef"
                  subtitleProps={{ width: 240 }}
                  subtitle={lineData.labels.maxLabel(
                    lineData.max,
                    lineData.labels.unit,
                    lineData.getX,
                    lineData.getY
                  )}
                />
              </Annotation>
            ) : null}
            {lineData.showMinLabel ? (
              <Annotation
                dx={i === 0 ? 100 : 50}
                dy={(i + 1) * 100}
                dataKey={lineData.id}
                datum={lineData.min}
              >
                <Connector stroke="#efefef" type="elbow" />
                <CircleSubject stroke="#efefef" radius={10} />
                <Label
                  backgroundFill="#efefef"
                  maxWidth={200}
                  subtitleProps={{ width: 240 }}
                  subtitle={lineData.labels.minLabel(
                    lineData.min,
                    lineData.labels.unit,
                    lineData.getX,
                    lineData.getY
                  )}
                />
              </Annotation>
            ) : null}
          </>
        )
      })}
      <Axis
        tickLabelProps={{
          fill: '#fff',
          stroke: '#fff',
          fontFamily: theme.fontFamily,
        }}
        stroke="#fff"
        orientation="left"
        numTicks={10}
      />
      <Axis
        stroke="#fff"
        tickLabelProps={{
          fill: '#fff',
          stroke: '#fff',
          fontFamily: theme.fontFamily,
        }}
        orientation="bottom"
        numTicks={10}
      />
    </XYChart>
  )
}

export function SingleSourceLineChart<T extends object>(
  props: SingleSourceLineChartProps<T>
) {
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

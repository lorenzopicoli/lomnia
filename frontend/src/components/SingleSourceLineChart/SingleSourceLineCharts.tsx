import { ParentSize } from '@visx/responsive'
// import { scaleLinear, scaleTime } from '@visx/scale'
import * as allCurves from '@visx/curve'
import { Annotation, Axis, LineSeries, Tooltip, XYChart } from '@visx/xychart'
import { format } from 'date-fns/format'
import { CircleSubject, Connector, Label } from '@visx/annotation'
import { useMantineTheme } from '@mantine/core'
// import styles from './LineChart.module.css'
import { unitToLabel, type LineData } from '../../charts/charts'
import { Group } from '@visx/group'

// type SupportedScales =
//   | ReturnType<typeof scaleTime<number>>
//   | ReturnType<typeof scaleLinear<number>>

export type SingleSourceLineChartProps<T> = {
  heightOffset?: number
  data: T[]
  lines: LineData<T>[]
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
      />

      {lines.map((lineData, i) => {
        return (
          <Group key={i}>
            <LineSeries
              dataKey={lineData.id}
              data={data}
              xAccessor={lineData.accessors.getX}
              yAccessor={lineData.accessors.getY}
              curve={allCurves.curveMonotoneX}
              stroke={'rgba(123, 46, 218)'}
            />
          </Group>
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

      {lines.map((lineData, i) => {
        return (
          <Group key={i}>
            <Tooltip<T>
              offsetTop={i * 50}
              showVerticalCrosshair
              snapTooltipToDatumX
              snapTooltipToDatumY
              renderTooltip={({ tooltipData }) => (
                <>
                  {format(
                    lineData.accessors.getX(
                      tooltipData!.datumByKey[lineData.id].datum
                    ),
                    'PP p'
                  )}
                  :{' '}
                  {lineData.accessors
                    .getY(tooltipData!.datumByKey[lineData.id].datum)
                    .toFixed(2)}
                  {unitToLabel(lineData.labels.unit)}
                </>
              )}
            />
            {lineData.labels.showMaxLabel ? (
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
                    lineData.accessors.getY(lineData.max),
                    lineData.labels.unit
                  )}
                />
              </Annotation>
            ) : null}
            {lineData.labels.showMinLabel ? (
              <Annotation
                dx={i === 0 ? 100 : 40}
                dy={(i + 1) * 80}
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
                    lineData.accessors.getY(lineData.min),
                    lineData.labels.unit
                  )}
                />
              </Annotation>
            ) : null}
          </Group>
        )
      })}
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
          height={height - (props.heightOffset ?? 0)}
          width={width}
        />
      )}
    </ParentSize>
  )
}

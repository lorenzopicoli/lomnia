import { useInViewport } from '@mantine/hooks'
import { ParentSize } from '@visx/responsive'
import { ChartType } from '../../charts/charts'
import { useCallback, useMemo } from 'react'
import type {
  GenericChartAreaProps,
  InternalGenericChartAreaProps,
} from './GenericChartTypes'
import { getMaxDomains } from './utils'
import { GenericChart } from './GenericChart'
import { useMantineTheme } from '@mantine/core'
import useEventEmitters from '../../charts/useEventEmitters'
import type { localPoint } from '@visx/event'
import { GenericChartGrids } from './GenericChartGrids'
import { GenericChartAxis } from './GenericChartAxis'
import { useChartScales } from '../../charts/useChartScales'
import {
  isScaleBand,
  isScaleLinear,
  isScaleUtc,
  type ChartScaleBand,
} from '../../charts/types'
import { GenericChartSynchronized } from './GenericChartSynchronized'
import { bisector } from '@visx/vendor/d3-array'

// The order at which the charts are rendered. Later charts will be drawn on top of previous charts
const order: Record<ChartType, number> = {
  [ChartType.AreaChart]: 0,
  [ChartType.BarChart]: 1,
  [ChartType.LineChart]: 2,
}

/**
 * Responsible for properly handling the chart dimensions, figuring out the right scale,
 * displaying axis and other addons. It then uses other components to actually display the shape
 */
export function GenericChartArea<T extends object>(
  props: GenericChartAreaProps<T>
) {
  const { ref, inViewport } = useInViewport()
  return (
    <>
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <div style={{ width: '100%', height: '100%' }} ref={ref}>
            {inViewport ? (
              <>
                <GenericChartAreaInternal
                  {...props}
                  height={height}
                  width={width}
                />
                {/* Maybe use deferred value for this?  */}
                <GenericChartSynchronized
                  mainChart={props.mainChart}
                  secondaryCharts={props.secondaryCharts}
                  width={width}
                  height={height}
                />
              </>
            ) : null}
          </div>
        )}
      </ParentSize>
    </>
  )
}
function GenericChartAreaInternal<T extends object>(
  props: InternalGenericChartAreaProps<T>
) {
  const { height, width, mainChart, secondaryCharts } = props
  const theme = useMantineTheme()
  const backgroundColor = theme.colors.dark[9]
  const orderedCharts = useMemo(() => {
    const ordered = secondaryCharts
      .concat(mainChart)
      .sort((a, b) => order[a.type] - order[b.type])
    return ordered
  }, [mainChart, secondaryCharts])
  const domains = useMemo(() => getMaxDomains(orderedCharts), [orderedCharts])
  const margin = useMemo(
    () =>
      props.margin ? props.margin : { top: 0, left: 50, right: 0, bottom: 30 },
    [props.margin]
  )
  const chartId = useMemo(
    () => mainChart.id + secondaryCharts.map((c) => c.id).join(''),
    [mainChart.id, secondaryCharts]
  )
  const { xScale, yScale } = useChartScales<T>({
    mainChart,
    height,
    width,
    margin,
    domains,
  })
  const scaleBandInvert = (chartScale: ChartScaleBand) => {
    const { scale } = chartScale
    const domain = scale.domain()
    const paddingOuter = scale(domain[0]) ?? 0
    const eachBand = scale.step()
    return function (value: number) {
      const index = Math.floor((value - paddingOuter) / eachBand)
      return domain[Math.max(0, Math.min(index, domain.length - 1))]
    }
  }

  const getNearestDatum = useCallback(
    (svgPoint: ReturnType<typeof localPoint>) => {
      if (!svgPoint) {
        return { x: -1, y: -1 }
      }

      const x = isScaleBand(xScale)
        ? scaleBandInvert(xScale)(svgPoint.x)
        : isScaleLinear(xScale) || isScaleUtc(xScale)
        ? +xScale.scale.invert(svgPoint.x)
        : -1

      if (x === -1) {
        throw new Error('Could not find scale type for xScale')
      }

      const data = mainChart.data

      const bisect = bisector((v: T) =>
        Number(mainChart.accessors.getX(v))
      ).left
      const index = bisect(data, x)
      const nearestDatum = data[index]

      return {
        x: mainChart.accessors.getX(nearestDatum),
        y: mainChart.accessors.getY(nearestDatum),
      }
    },
    [mainChart.accessors, mainChart.data, xScale]
  )
  const eventEmitters = useEventEmitters({
    chartId,
    getNearestDatum,
  })
  return (
    <svg height={height} width={width} overflow="visible">
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={backgroundColor}
        rx={14}
      />
      <GenericChartGrids
        xScale={xScale}
        yScale={yScale}
        width={width}
        height={height}
        margin={margin}
      />
      {orderedCharts.map((chart) => {
        return (
          <GenericChart
            {...chart}
            key={'generic-chart' + chart.id}
            xScale={xScale}
            yScale={yScale}
            outerHeight={height}
            outerWidth={width}
            margin={margin}
          />
        )
      })}
      <GenericChartAxis
        xScale={xScale}
        yScale={yScale}
        height={height}
        margin={margin}
        mainChart={mainChart}
      />
      {/* Event capture rect */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={'transparent'}
        {...eventEmitters}
      />
    </svg>
  )
}

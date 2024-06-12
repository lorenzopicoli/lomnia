import { useInViewport } from '@mantine/hooks'
import { ParentSize } from '@visx/responsive'
import { ChartType, unitToLabel } from '../../charts/charts'
import { format } from 'date-fns/format'
import { isDate } from 'lodash'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { scaleBand, scaleLinear, scalePoint, scaleTime } from '@visx/scale'
import { isNumber } from '../../utils/isNumber'
import { useMemo } from 'react'
import type {
  GenericChartAreaProps,
  InternalGenericChartAreaProps,
} from './GenericChartTypes'
import { getMaxDomains } from './utils'
import { GenericChart } from './GenericChart'
import { isDateLike } from '../../utils/isDateLike'

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
    <ParentSize debounceTime={10}>
      {({ width, height }) => (
        <div style={{ width: '100%', height: '100%' }} ref={ref}>
          {inViewport ? (
            <GenericChartAreaInternal
              {...props}
              height={height}
              width={width}
            />
          ) : null}
        </div>
      )}
    </ParentSize>
  )
}
function GenericChartAreaInternal<T extends object>(
  props: InternalGenericChartAreaProps<T>
) {
  const { height, width, mainChart, secondaryCharts } = props
  const orderedCharts = useMemo(() => {
    const ordered = secondaryCharts
      .concat(mainChart)
      .sort((a, b) => order[a.type] - order[b.type])
    return ordered
  }, [mainChart, secondaryCharts])

  const domains = getMaxDomains(orderedCharts)
  const margin = props.margin
    ? props.margin
    : { top: 0, left: 50, right: 0, bottom: 30 }

  const yScale = scaleLinear({
    domain: [domains.minY, domains.maxY],
    range: [height - margin.bottom - margin.top, 0],
  })

  // Tries to find the right scale given the data type of the x axis. Might want more control over
  // this in the future
  const xScale = isDateLike(domains.minX)
    ? scaleTime({
        domain: [new Date(domains.minX), new Date(domains.maxX)],
        range: [margin.left, width - margin.right],
      })
    : isNumber(domains.maxX) && isNumber(domains.minX)
    ? scaleLinear({
        domain: [domains.minX, domains.maxX],
        range: [margin.left, width - margin.right],
      })
    : mainChart.type === ChartType.BarChart
    ? scaleBand({
        domain: mainChart.data.map(mainChart.accessors.getX),
        padding: 0.2,
        range: [margin.left, outerWidth - margin.right],
      })
    : scalePoint({
        domain: mainChart.data.map(mainChart.accessors.getX),
        range: [margin.left, width - margin.right],
      })

  return (
    <svg height={height} width={width}>
      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill={'gray'} rx={14} />

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

      <AxisBottom
        top={height - margin.top - margin.bottom}
        scale={xScale}
        tickFormat={(v) => {
          const unit = unitToLabel(mainChart.axis.x.unit)
          if (isNumber(v)) {
            return `${v.toFixed(2)}${unit ? ' ' : ''}${unit}`
          }
          if (isDate(v)) {
            return format(v, 'yyyy-MM-dd')
          }
          console.log('Non number/date value in AxisBottom')
          return ''
        }}
        numTicks={10}
      />
      <AxisLeft
        tickFormat={(v) => {
          const unit = unitToLabel(mainChart.axis.y.unit)
          return `${v}${unit ? ' ' : ''}${unit}`
        }}
        left={margin.left}
        numTicks={10}
        scale={yScale}
      />
    </svg>
  )
}

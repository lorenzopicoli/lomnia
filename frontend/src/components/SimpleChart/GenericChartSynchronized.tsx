import { useContext, useMemo } from 'react'
import { getMaxDomains } from './utils'
import { useChartScales } from '../../charts/useChartScales'
import { SynchronizedContext } from '../../charts/SynchronizedContext'
import type { GenericChartProps } from './GenericChartTypes'
import { isScaleBand } from '../../charts/types'
import { Flex, useMantineTheme } from '@mantine/core'
import { MemoizationContext } from '../../charts/MemoizationContext'
import { isNil } from 'lodash'
import objectHash from 'object-hash'
import { isDateLike } from '../../utils/isDateLike'
import { format } from 'date-fns'
import { useElementSize } from '@mantine/hooks'
import { ChartType } from '../../charts/charts'

export function GenericChartSynchronized<T extends object>(props: {
  mainChart: GenericChartProps<T>
  secondaryCharts: GenericChartProps<T>[]
  width: number
  height: number
}) {
  const synchronizedContext = useContext(SynchronizedContext)
  const memoizationContext = useContext(MemoizationContext)
  const domains = useMemo(
    () => getMaxDomains(props.secondaryCharts.concat(props.mainChart)),
    [props.mainChart, props.secondaryCharts]
  )

  const margin = { top: 0, left: 50, right: 0, bottom: 30 }
  const { xScale, yScale } = useChartScales<T>({
    mainChart: props.mainChart,
    height: props.height,
    width: props.width,
    margin,
    domains,
  })
  const theme = useMantineTheme()
  const {
    ref: tooltipRef,
    width: tooltipWidth,
    height: tooltipHeight,
  } = useElementSize()

  // TODO: objectHash is super slow, we should probably use a different approach
  const hashByChartId = useMemo(() => {
    const hash: Record<string, string> = {}
    hash[props.mainChart.id] = JSON.stringify(props.mainChart.data)
    props.secondaryCharts.forEach((chart) => {
      hash[chart.id] = JSON.stringify(chart.data)
    })
    return hash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.mainChart.data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.secondaryCharts),
    props.mainChart.id,
  ])
  const nearestDatum = useMemo(() => {
    if (!memoizationContext) {
      return null
    }

    if (!synchronizedContext?.currentDatum) {
      return null
    }

    return memoizationContext?.memoizedGetNearestDatum({
      // TODO: Temporary, this makes it so the "generic" type of chart props isn't really generic
      data: props.mainChart.data as {
        x: string | Date | number
        y: number
      }[],
      dataHash: hashByChartId[props.mainChart.id],
      datumXAccessorKey: 'genericGetX',
      datumYAccessorKey: 'genericGetY',
      point: { x: synchronizedContext?.currentDatum.x },
    })
  }, [
    hashByChartId,
    memoizationContext,
    props.mainChart.data,
    props.mainChart.id,
    synchronizedContext?.currentDatum,
  ])

  const secondaryChartsDatums = useMemo(() => {
    if (!memoizationContext) {
      return null
    }

    const currentDatum = synchronizedContext?.currentDatum
    if (!currentDatum) {
      return null
    }
    return props.secondaryCharts.map((chart) => {
      return {
        chart,
        datum: memoizationContext?.memoizedGetNearestDatum({
          data: chart.data as {
            x: string | Date | number
            y: number
          }[],
          dataHash: hashByChartId[chart.id],
          datumXAccessorKey: 'genericGetX',
          datumYAccessorKey: 'genericGetY',
          point: { x: currentDatum.x },
        }),
      }
    })
  }, [
    hashByChartId,
    memoizationContext,
    props.secondaryCharts,
    synchronizedContext?.currentDatum,
  ])

  const datumX = useMemo(() => nearestDatum?.x, [nearestDatum])
  const datumY = useMemo(() => nearestDatum?.y, [nearestDatum])

  const formattedX = useMemo(
    () => (isDateLike(datumX) ? format(datumX, 'dd/MM HH:mm') : datumX),
    [datumX]
  )
  const formattedY = useMemo(() => Number(datumY?.toFixed(2)), [datumY])

  const targetRadius = 5
  const offsetX = useMemo(
    () => (isScaleBand(xScale) ? xScale.scale.bandwidth() / 2 : 0),
    [xScale]
  )
  const pointX = useMemo(() => {
    if (typeof datumX === 'string') {
      return null
    }
    if (isNil(datumX)) {
      return null
    }
    return (xScale.scale(datumX) ?? 0) + offsetX
  }, [datumX, xScale, offsetX])

  const pointY = useMemo(() => {
    if (isNil(datumY)) {
      return null
    }
    return yScale.scale(datumY) ?? 0
  }, [datumY, yScale])

  if (isNil(pointX) || isNil(pointY)) {
    return null
  }

  const tooltipPadding = 12

  const isTooLow =
    pointY + tooltipHeight > props.height - margin.top - margin.bottom
  const isTooRight =
    pointX + tooltipWidth > props.width - margin.left - margin.right
  const tooltipTopOffset = isTooLow ? -tooltipHeight - tooltipPadding * 2 : 0

  const tooltipLeftOffset = isTooRight ? -tooltipWidth - tooltipPadding * 2 : 0

  const tooltipX = pointX + tooltipLeftOffset + 10
  const tooltipY = pointY + tooltipTopOffset
  return (
    <div
      style={{
        position: 'absolute',
        width: props.width,
        height: props.height,
        paddingLeft: margin.left,
        paddingRight: margin.right,
        paddingTop: margin.top,
        paddingBottom: margin.bottom,
        left: 0,
        top: 0,
        backgroundColor: 'transparent',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 100,
      }}
    >
      <Flex
        ref={tooltipRef}
        direction={'column'}
        p={tooltipPadding}
        style={{
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.dark[8],
          position: 'absolute',
          left: tooltipX,
          top: tooltipY,
        }}
      >
        <span>{formattedY}</span>
        <span>{formattedX}</span>
      </Flex>
      <svg
        overflow={'visible'}
        width={targetRadius * 5}
        height={targetRadius * 5}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          left: 0,
        }}
      >
        {(secondaryChartsDatums ?? []).map((chartDatum) => {
          if (isNil(chartDatum.datum?.x) || isNil(chartDatum.datum?.y)) {
            return null
          }
          const secondaryPointX =
            (xScale.scale(+chartDatum.datum.x) ?? 0) +
            (chartDatum.chart.type === ChartType.BarChart ? offsetX : 0)
          const secondaryPointY = yScale.scale(chartDatum.datum.y)
          return (
            <circle
              key={chartDatum.chart.id}
              cx={secondaryPointX}
              cy={secondaryPointY}
              r={targetRadius}
              stroke={theme.colors.violet[9]}
              fill={theme.colors.violet[5]}
              strokeWidth="1px"
            />
          )
        })}
        <circle
          cx={pointX}
          cy={pointY}
          r={targetRadius}
          stroke={theme.colors.violet[9]}
          fill={theme.colors.violet[5]}
          strokeWidth="1px"
        />
      </svg>
    </div>
  )
}

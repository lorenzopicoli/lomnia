import { useContext, useMemo } from 'react'
import { getMaxDomains } from './utils'
import { useChartScales } from '../../charts/useChartScales'
import { SynchronizedContext } from '../../charts/SynchronizedContext'
import type { GenericChartProps } from './GenericChartTypes'
import { isScaleBand } from '../../charts/types'
import { useMantineTheme } from '@mantine/core'
import { MemoizationContext } from '../../charts/MemoizationContext'
import { isNil } from 'lodash'
import objectHash from 'object-hash'
import { isDateLike } from '../../utils/isDateLike'
import { format } from 'date-fns'
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

  const dataHash = useMemo(() => {
    return objectHash(props.mainChart.data)
  }, [props.mainChart.data])
  const nearestDatum =
    synchronizedContext?.currentDatum && memoizationContext
      ? memoizationContext?.memoizedGetNearestDatum({
          data: props.mainChart.data as any,
          dataHash: dataHash,
          datumXAccessorKey: 'genericGetX',
          datumYAccessorKey: 'genericGetY',
          point: { x: synchronizedContext?.currentDatum.x },
        })
      : null
  const datumX = useMemo(() => nearestDatum?.x, [nearestDatum])
  const datumY = useMemo(() => nearestDatum?.y, [nearestDatum])

  const formattedX = useMemo(
    () => (isDateLike(datumX) ? format(datumX, 'dd/MM HH:mm') : datumX),
    [datumX]
  )

  //   const formattedOriginalX = isDateLike(synchronizedContext?.currentDatum?.x)
  //     ? format(synchronizedContext?.currentDatum?.x, 'dd/MM HH:mm')
  //     : synchronizedContext?.currentDatum?.x

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

  //   const pointY = yScale.scale(datumY) ?? 0
  const pointY = useMemo(() => {
    if (isNil(datumY)) {
      return null
    }
    return yScale.scale(datumY) ?? 0
  }, [datumY, yScale])

  if (isNil(pointX) || isNil(pointY)) {
    return null
  }

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
      }}
    >
      <div style={{ backgroundColor: theme.colors.dark[9], width: 200 }}>
        {formattedX}
      </div>
      <div
        style={{
          backgroundColor: theme.colors.dark[8],
          position: 'absolute',
          width: 100,
          height: 25,
          left: pointX + 10,
          top: pointY - 35,
        }}
      >
        {datumY}
      </div>
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

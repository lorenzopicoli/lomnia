import { useCallback, useContext, useMemo } from 'react'
import { getMaxDomains } from './utils'
import { useChartScales } from '../../charts/useChartScales'
import { SynchronizedContext } from '../../charts/SynchronizedContext'
import type { GenericChartProps } from './GenericChartTypes'
import { isDateLike } from '../../utils/isDateLike'
import { format } from 'date-fns'
import { isScaleBand } from '../../charts/types'
import { useMantineTheme } from '@mantine/core'
export function GenericChartSynchronized<T>(props: {
  mainChart: GenericChartProps<T>
  secondaryCharts: GenericChartProps<T>[]
  width: number
  height: number
}) {
  const synchronizedContext = useContext(SynchronizedContext)
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

  const getNearestDatumToXY = useCallback(
    (x: string | number | Date) => {
      const data = props.mainChart.data
      if (typeof x === 'string') {
        return { x: -1, y: -1 }
      }
      const nearest = data.reduce(
        (acc, curr) => {
          const currX = +props.mainChart.accessors.getX(curr)
          const currDistance = Math.sqrt((currX - +x) ** 2)
          if (acc.distance > currDistance) {
            return { distance: currDistance, datum: curr }
          }
          return acc
        },
        { distance: Infinity, datum: null } as {
          distance: number
          datum: T | null
        }
      )

      if (!nearest.datum) {
        return { x: -4, y: -4 }
      }

      return {
        x: props.mainChart.accessors.getX(nearest.datum),
        y: props.mainChart.accessors.getY(nearest.datum),
      }
    },
    [props.mainChart.accessors, props.mainChart.data]
  )
  const nearestDatum = useMemo(
    () =>
      synchronizedContext?.currentDatum
        ? getNearestDatumToXY(synchronizedContext?.currentDatum.x)
        : { x: -5, y: -5 },
    [synchronizedContext?.currentDatum, getNearestDatumToXY]
  )

  if (typeof nearestDatum.x === 'string') {
    return null
  }

  const formattedX = isDateLike(nearestDatum.x)
    ? format(nearestDatum.x, 'dd/MM HH:mm')
    : nearestDatum.x
  const formattedOriginalX = isDateLike(synchronizedContext?.currentDatum?.x)
    ? format(synchronizedContext?.currentDatum?.x, 'dd/MM HH:mm')
    : synchronizedContext?.currentDatum?.x

  const targetRadius = 5
  //   console.log('the x pos', xScale.scale(nearestDatum.x), nearestDatum)
  const offsetX = isScaleBand(xScale) ? xScale.scale.bandwidth() / 2 : 0
  const pointX = (xScale.scale(nearestDatum.x) ?? 0) + offsetX
  const pointY = yScale.scale(nearestDatum.y) ?? 0
  return (
    // <props.Tooltip
    //   unstyled={true}
    //   offsetLeft={offsetX}
    //   offsetTop={0}
    //   applyPositionStyle={true}
    //   // set this to random so it correctly updates with parent bounds
    //   key={Math.random()}
    //   top={yScale.scale(nearestDatum.y)}
    //   left={xScale.scale(nearestDatum.x)}
    // >
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
        {nearestDatum.y}
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

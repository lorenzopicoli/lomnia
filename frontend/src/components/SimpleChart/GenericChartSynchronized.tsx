import { useCallback, useContext, useMemo } from 'react'
import { getMaxDomains } from './utils'
import { useChartScales } from '../../charts/useChartScales'
import { SynchronizedContext } from '../../charts/SynchronizedContext'
import type { TooltipInPortalProps } from '@visx/tooltip/lib/hooks/useTooltipInPortal'
import type { GenericChartProps } from './GenericChartTypes'
import { isDateLike } from '../../utils/isDateLike'
import { format } from 'date-fns'
import { useTooltip } from '@visx/tooltip'
export function GenericChartSynchronized<T>(props: {
  mainChart: GenericChartProps<T>
  secondaryCharts: GenericChartProps<T>[]
  width: number
  height: number
  Tooltip: React.FC<TooltipInPortalProps>
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
  const nearestDatum = synchronizedContext?.currentDatum
    ? getNearestDatumToXY(synchronizedContext?.currentDatum.x)
    : { x: -5, y: -5 }

  if (typeof nearestDatum.x === 'string') {
    return null
  }

  const formattedX = isDateLike(nearestDatum.x)
    ? format(nearestDatum.x, 'dd/MM HH:mm')
    : nearestDatum.x
  const formattedOriginalX = isDateLike(synchronizedContext?.currentDatum?.x)
    ? format(synchronizedContext?.currentDatum?.x, 'dd/MM HH:mm')
    : synchronizedContext?.currentDatum?.x
  return (
    <props.Tooltip
      unstyled={true}
      offsetLeft={0}
      offsetTop={0}
      applyPositionStyle={true}
      // set this to random so it correctly updates with parent bounds
      key={Math.random()}
      top={yScale.scale(nearestDatum.y)}
      left={xScale.scale(nearestDatum.x)}
    >
      <svg
        width="20"
        height="20"
        style={{ position: 'absolute', top: -10, left: -10 }}
      >
        <circle cx="10" cy="10" r="10" fill="red" />
      </svg>
      {/* {formattedOriginalX}, {synchronizedContext?.currentDatum?.y}
      <br />
      {formattedX}, {nearestDatum.y} */}
    </props.Tooltip>
  )
}

import { ChartType } from '../../charts/charts'
import { curveMonotoneX } from '@visx/curve'
import { Area, Bar, LinePath } from '@visx/shape'
import { scaleBand } from '@visx/scale'
import type { InternalGenericChartProps } from './GenericChartTypes'
import { isNumber } from '../../utils/isNumber'
import { useCallback } from 'react'
import { isDate } from 'lodash'

/**
 * Responsible for displaying a single shape (the component name should be changed)
 * It is not responsible for handling any sort of scaling, displaying axis or anything
 */
export function GenericChart<T extends object>(
  chart: InternalGenericChartProps<T>
) {
  const {
    xScale: xNumericScale,
    xBandScale,
    yScale,
    accessors: { getX, getY },
    type,
    outerWidth,
    outerHeight,
    margin,
  } = chart
  const xGetAndScale = useCallback(
    (datum: T) => {
      const x = getX(datum)
      if (xNumericScale && (isNumber(x) || isDate(x))) {
        return xNumericScale(x)
      }
      if (xBandScale) {
        return xBandScale(x)
      }
      console.log(
        `Missing a good xScale for chart. Maybe X isn't ${x} isn't date/numeric and you chose a date/numeric scale?`
      )
    },
    [getX, xBandScale, xNumericScale]
  )

  if (type === ChartType.LineChart) {
    return (
      <LinePath
        data={chart.data}
        x={(x) => xGetAndScale(x)}
        y={(y) => yScale(getY(y))}
        curve={curveMonotoneX}
        stroke={'#fff'}
      />
    )
  }
  if (type === ChartType.BarChart) {
    const bandScale =
      xBandScale ??
      scaleBand({
        domain: chart.data.map(getX),
        padding: 0.2,
        range: [margin.left, outerWidth - margin.right],
      })
    return (
      <>
        {chart.data.map((barData) => {
          const yMax = outerHeight - margin.top - margin.bottom
          const barWidth = bandScale.bandwidth()
          const barHeight = yMax - (yScale(getY(barData) as number) ?? 0)
          const x = chart.accessors.getX(barData)
          const barX = bandScale(x)
          const barY = yMax - barHeight
          return (
            <>
              <Bar
                key={'bar' + x + barY}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill="rgba(23, 233, 217, .5)"
              />
            </>
          )
        })}
      </>
    )
  }
  if (type === ChartType.AreaChart) {
    return (
      <Area
        data={chart.data}
        x={(x) => xGetAndScale(x)}
        y={(y) => yScale(getY(y))}
        y1={outerHeight - margin.bottom}
        curve={curveMonotoneX}
        fill="blue"
        stroke={'#000'}
      />
    )
  }
  return null
}

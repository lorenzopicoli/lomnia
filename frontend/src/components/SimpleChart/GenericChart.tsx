import { ChartType } from '../../charts/charts'
import { curveMonotoneX } from '@visx/curve'
import { Area, LinePath } from '@visx/shape'
import { scaleBand } from '@visx/scale'
import type { InternalGenericChartProps } from './GenericChartTypes'
import { isNumber } from '../../utils/isNumber'
import { useCallback } from 'react'
import { isDate } from 'lodash'
import { useMantineTheme } from '@mantine/core'
import { LinearGradient } from '@visx/gradient'
import { isScaleBand } from '../../charts/types'

/**
 * Responsible for displaying a single shape (the component name should be changed)
 * It is not responsible for handling any sort of scaling, displaying axis or anything
 */
export function GenericChart<T extends object>(
  chart: InternalGenericChartProps<T>
) {
  const {
    xScale,
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
      if (xScale && (isNumber(x) || isDate(x))) {
        const value = xScale.scale(x)
        if (value) {
          return value
        } else {
          console.log('Numeric scale failed to scale x value')
          return -1
        }
      }
      if (isScaleBand(xScale)) {
        const value = xScale.scale(x)
        if (value) {
          return value
        } else {
          console.log('Band scale failed to scale x value')
          return -1
        }
      }
      console.log(
        `Missing a good xScale for chart. Maybe X isn't ${x} isn't date/numeric and you chose a date/numeric scale?`
      )
      return -1
    },
    [getX, xScale]
  )
  const theme = useMantineTheme()

  const barGradient = () => (
    <LinearGradient
      id="gradient"
      from={theme.colors.violet[2]}
      to={theme.colors.violet[3]}
      rotate="-45"
    />
  )

  const areaStroke = ' rgba(55, 57, 120, 1)'
  const areaGradient = () => (
    <LinearGradient
      id="gradient-area"
      from="#D3A4FF"
      to="#9B9DDC"
      rotate="-45"
    />
  )

  const lineChartGradient = () => (
    <LinearGradient id="gradient-line" from="#FFD700" to="#FF8C42" rotate="0" />
  )

  if (type === ChartType.LineChart) {
    return (
      <>
        {lineChartGradient()}
        <LinePath
          data={chart.data}
          x={(x) => xGetAndScale(x)}
          y={(y) => yScale.scale(getY(y))}
          curve={curveMonotoneX}
          strokeWidth={2}
          // stroke={lineChartColor}
          stroke="url(#gradient-line)"
        />
      </>
    )
  }
  if (type === ChartType.BarChart) {
    // If the original xScale is not a band scale, we have to create one to properly display the bars
    const bandScale = isScaleBand(xScale)
      ? xScale
      : {
          type: 'band' as const,
          scale: scaleBand({
            domain: chart.data.map(getX),
            padding: 0.2,
            range: [margin.left, outerWidth - margin.right],
          }),
        }
    return (
      <>
        {chart.data.map((barData) => {
          const yMax = outerHeight - margin.top - margin.bottom
          const barWidth = bandScale.scale.bandwidth()
          const barHeight = yMax - (yScale.scale(getY(barData) as number) ?? 0)
          const x = chart.accessors.getX(barData)
          const barX = bandScale.scale(x)
          const barY = yMax - barHeight
          const radius = 0

          const rectPath = `
            M${barX},${barY + radius}
            q0,-${radius} ${radius},-${radius}
            h${barWidth - radius * 2}
            q${radius},0 ${radius},${radius}
            v${barHeight - radius}
            h-${barWidth}
            v-(${barHeight - radius})
            z
          `
          return barHeight > 0 ? (
            <>
              {barGradient()}
              <path
                key={'bar-chart' + barX + barY}
                fill="url(#gradient)"
                d={rectPath}
              />
            </>
          ) : null
        })}
      </>
    )
  }
  if (type === ChartType.AreaChart) {
    return (
      <>
        {areaGradient()}
        <Area
          data={chart.data}
          x={(x) => xGetAndScale(x)}
          y={(y) => yScale.scale(getY(y))}
          y1={outerHeight - margin.bottom}
          curve={curveMonotoneX}
          strokeWidth={3}
          fill="url(#gradient-area)"
          stroke={areaStroke}
        />
      </>
    )
  }
  return null
}

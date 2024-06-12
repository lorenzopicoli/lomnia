import type { ChartAreaConfig } from '../../charts/charts'
import { useChartData } from '../../charts/useChartData'
import { GenericChartArea } from './GenericChartArea'
import { isNil } from 'lodash'

/**
 * Responsible for connecting the data provider to the chart area
 */
export function GenericChartContainer(props: {
  chart: ChartAreaConfig
  startDate: Date
  endDate: Date
}) {
  const { mainChart, secondaryCharts, isLoading } = useChartData(
    {
      id: props.chart.id,
      filters: {
        startDate: props.startDate,
        endDate: props.endDate,
      },
      config: {
        xKey: props.chart.xKey,
        aggregation: props.chart.aggregation,
        shapes: props.chart.shapes,
      },
    },
    true
  )

  if (isLoading || isNil(mainChart) || isNil(secondaryCharts)) {
    return <div>Loading...</div>
  }

  return (
    <GenericChartArea mainChart={mainChart} secondaryCharts={secondaryCharts} />
  )
}

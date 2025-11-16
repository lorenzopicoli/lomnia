import { useInViewport } from "@mantine/hooks";
import { isNil } from "lodash";
import type { ChartAreaConfig } from "../../../charts/charts";
import { useChartData } from "../../../charts/useChartData";
import { GenericChartArea } from "./GenericChartArea";

/**
 * Responsible for connecting the data provider to the chart area
 */
export function GenericChartContainer(props: { chart: ChartAreaConfig; startDate: Date; endDate: Date }) {
  const { ref, inViewport } = useInViewport();
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
    inViewport,
  );

  if (isLoading || isNil(mainChart) || isNil(secondaryCharts)) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div ref={ref} />
      <GenericChartArea mainChart={mainChart} secondaryCharts={secondaryCharts} />
    </>
  );
}

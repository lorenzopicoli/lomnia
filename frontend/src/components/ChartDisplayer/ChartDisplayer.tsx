import { ChartId, type ChartProps, ChartSource } from "../../charts/types";
import { HeartRateMinMaxAvg } from "../../containers/Charts/HeartRateMinMaxAvg";
import { PrecipitationExperienced } from "../../containers/Charts/PrecipitationExperienced";
import { RainHeatmap } from "../../containers/Charts/RainHeatmap";
import { TemperatureExperienced } from "../../containers/Charts/TemperatureExperienced";

interface ChartDisplayerProps extends ChartProps {
  chartId: ChartId;
}

export function ChartDisplayer(props: ChartDisplayerProps) {
  switch (props.chartId) {
    case ChartId.HeartRateMinMaxAvg:
      return <HeartRateMinMaxAvg {...props} />;
    case ChartId.PrecipitationExperienced:
      return <PrecipitationExperienced {...props} />;
    case ChartId.TemperatureExperienced:
      return <TemperatureExperienced {...props} />;
    case ChartId.RainHeatmap:
      return <RainHeatmap {...props} />;
  }
}

export const availableCharts = [
  {
    id: ChartId.TemperatureExperienced,
    title: "Temperature vs Apparent Temperature",
    description: "Analyze how the measured temperature compares against the apparent temperature you experienced",
    sources: [ChartSource.Weather],
  },
  {
    id: ChartId.HeartRateMinMaxAvg,
    title: "Min, max and median recorded heart rate",
    description: "See how your median heart rate compares against the max/min recorded entries for the period",
    sources: [ChartSource.HeartRate],
  },
  {
    id: ChartId.PrecipitationExperienced,
    title: "Precipitation Experienced (snow + rain)",
    description: "See how much rain and snow you have experienced",
    sources: [ChartSource.Weather],
  },
  {
    id: ChartId.RainHeatmap,
    title: "Rain experienced in a calendar",
    description: "See how much rain you have experienced",
    sources: [ChartSource.Weather],
  },
];

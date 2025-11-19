import { type AllChartsProps, ChartElement, ChartId, ChartSource } from "../../charts/types";
import { CountCard } from "../../containers/Charts/CountCard";
import { HeartRateMinMaxAvg } from "../../containers/Charts/HeartRateMinMaxAvg";
import { NumberHabitCalendarHeatmap } from "../../containers/Charts/NumberHabitCalendarHeatmap";
import { PrecipitationExperienced } from "../../containers/Charts/PrecipitationExperienced";
import { RainHeatmap } from "../../containers/Charts/RainHeatmap";
import { TemperatureExperienced } from "../../containers/Charts/TemperatureExperienced";
import { ChartPlaceholder } from "../ChartPlaceholder/ChartPlaceholder";

interface ChartDisplayerProps extends AllChartsProps {
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
    case ChartId.NumberHabitCalendarHeatmap: {
      const habitKey = props.habitKey;
      if (!habitKey) {
        return <ChartPlaceholder text="Select a habit key to see data in here" />;
      }
      return <NumberHabitCalendarHeatmap {...props} habitKey={habitKey} />;
    }
    case ChartId.Count: {
      const countKey = props.countKey;
      if (!countKey) {
        return <ChartPlaceholder text="Select a count key to see data in here" />;
      }
      return <CountCard {...props} countKey={countKey} />;
    }
  }
}

export const availableCharts = [
  {
    id: ChartId.TemperatureExperienced,
    title: "Temperature vs Apparent Temperature",
    description: "Analyze how the measured temperature compares against the apparent temperature you experienced",
    sources: [ChartSource.Weather],
    elements: [ChartElement.Line],
  },
  {
    id: ChartId.HeartRateMinMaxAvg,
    title: "Min, max and median recorded heart rate",
    description: "See how your median heart rate compares against the max/min recorded entries for the period",
    sources: [ChartSource.HeartRate],
    elements: [ChartElement.Line],
  },
  {
    id: ChartId.PrecipitationExperienced,
    title: "Precipitation Experienced (snow + rain)",
    description: "See how much rain and snow you have experienced",
    sources: [ChartSource.Weather],
    elements: [ChartElement.Bar],
  },
  {
    id: ChartId.RainHeatmap,
    title: "Rain experienced in a calendar",
    description: "See how much rain you have experienced",
    sources: [ChartSource.Weather],
    elements: [ChartElement.CalendarHeatmap],
  },
  {
    id: ChartId.NumberHabitCalendarHeatmap,
    title: "Calendar heatmap of habit",
    description: "See how often and by how much you do a certain habit in a calendar",
    sources: [ChartSource.Habit],
    elements: [ChartElement.CalendarHeatmap],
  },
  {
    id: ChartId.Count,
    title: "Entry count",
    description: "Displays the number of entries collected from a source",
    sources: [ChartSource.Meta],
    elements: [ChartElement.Value],
  },
];

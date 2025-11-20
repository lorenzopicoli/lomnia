export type ChartAreaConfig = {
  /**
   * The chart id that is used to render the right component.
   * A dashboard could have more than one chart with the same id
   */
  id: ChartId;
  /**
   * Title of the chart
   */
  title: string;
  /**
   * Habit Key
   */
  habitKey?: string;
  /**
   * Key if a count chart
   */
  countKey?: string;
  /**
   * A random uuid that uniquely identifies this instance of the chart
   */
  uniqueId: string;
};

export enum ChartId {
  TemperatureExperienced = "temperatureExperienced",
  HeartRateMinMaxAvg = "heartRateMinMaxAvg ",
  PrecipitationExperienced = "precipitationExperienced ",
  RainHeatmap = "rainHeatmap",
  NumberHabitCalendarHeatmap = "numberHabitCalendarHeatmap",
  MetaValue = "metaValue",
  Count = "Count",
}

const aggregationPeriods = ["month", "day", "week", "hour"] as const;
export type AggregationPeriod = (typeof aggregationPeriods)[number];

export interface ChartProps {
  startDate: Date;
  endDate: Date;
  aggPeriod: AggregationPeriod;
  title?: string;
}
export interface HabitChartProps extends ChartProps {
  habitKey: string;
}

export interface CountCardChartProps extends ChartProps {
  unit?: string;
  description?: string;
  countKey: string;
}

export type AllChartsProps = ChartProps & Partial<HabitChartProps> & Partial<CountCardChartProps>;

export enum ChartSource {
  Weather = "weather",
  Habit = "habit",
  HeartRate = "heartRate",
  Meta = "meta",
}

export enum ChartElement {
  Line = "line",
  Area = "area",
  CalendarHeatmap = "calendarHeatmap",
  Bar = "bar",
  Value = "value",
}

export function chartSourceTitleAndDescription(source: ChartSource): {
  title: string;
  description: string;
} {
  switch (source) {
    case ChartSource.Weather:
      return {
        title: "Weather",
        description: "Weather data of the location of the user",
      };
    case ChartSource.Habit:
      return {
        title: "Habit",
        description: "Habit data tracked by the user",
      };
    case ChartSource.HeartRate:
      return {
        title: "Heart Rate",
        description: "Heart rate data collected",
      };
    case ChartSource.Meta:
      return {
        title: "Meta information",
        description: "Data on the system (eg. number of entries collected)",
      };
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

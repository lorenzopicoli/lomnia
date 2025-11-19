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

export const aggregationPeriods = ["month", "day", "week", "hour"] as const;
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

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
   * How to aggregate data
   */
  aggFun?: AggregationFunction;
  /**
   * Use compact number notation (1.2k, 3.4M…)
   */
  compactNumbers?: boolean;
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
  TextHabitCoocurrencesChord = "textHabitCoocurrencesChord ",
  Count = "Count",
  CountriesVisitedMap = "countriesVisitedMap",
  CountriesVisitedBar = "countriesVisitedBar",
  CountriesVisitedPie = "countriesVisitedPie",
  CitiesVisitedBar = "citiesVisitedBar",
  CitiesVisitedPie = "citiesVisitedPie",
  PlacesVisitCountBar = "placesVisitCountBar",
}

export type ChartParams = "habitKey" | "countKey" | "compactNumbers" | "aggFun";

export const chartParamByChartId: Record<ChartId, ChartParams[]> = {
  [ChartId.TemperatureExperienced]: [],
  [ChartId.HeartRateMinMaxAvg]: [],
  [ChartId.PrecipitationExperienced]: [],
  [ChartId.RainHeatmap]: [],
  [ChartId.NumberHabitCalendarHeatmap]: ["habitKey", "aggFun"],
  [ChartId.TextHabitCoocurrencesChord]: ["habitKey"],
  [ChartId.Count]: ["countKey", "compactNumbers"],
  [ChartId.CountriesVisitedMap]: [],
  [ChartId.CountriesVisitedBar]: [],
  [ChartId.CountriesVisitedPie]: [],
  [ChartId.CitiesVisitedBar]: [],
  [ChartId.CitiesVisitedPie]: [],
  [ChartId.PlacesVisitCountBar]: [],
};

const aggregationPeriods = ["month", "day", "week", "hour"] as const;
export type AggregationPeriod = (typeof aggregationPeriods)[number];

export const aggregationFunctions = ["avg", "median", "max", "min", "sum"] as const;
export const aggregationFunctionLabels = [
  { value: "avg", label: "avg" },
  { value: "median", label: "median" },
  { value: "max", label: "max" },
  { value: "min", label: "min" },
  { value: "sum", label: "sum" },
] as const;
export type AggregationFunction = (typeof aggregationFunctions)[number];

export interface ChartProps {
  startDate: Date;
  endDate: Date;
  aggPeriod: AggregationPeriod;
  aggFun?: AggregationFunction;
  title?: string;
}
export interface HabitChartProps extends ChartProps {
  habitKey: string;
}

export interface CountCardChartProps extends ChartProps {
  unit?: string;
  description?: string;
  countKey: string;
  compactNumbers?: boolean;
}

export type AllChartsProps = ChartProps & Partial<HabitChartProps> & Partial<CountCardChartProps>;

export enum ChartSource {
  Weather = "weather",
  Habit = "habit",
  HeartRate = "heartRate",
  Location = "location",
  Meta = "meta",
}

export enum ChartElement {
  Line = "line",
  Area = "area",
  CalendarHeatmap = "calendarHeatmap",
  Bar = "bar",
  Pie = "pie",
  Value = "value",
  Chord = "chord",
  Geo = "geo",
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
        title: "Meta Information",
        description: "Data on the system (eg. number of entries collected)",
      };
    case ChartSource.Location:
      return {
        title: "Location data",
        description: "Data that was recorded by your GPS",
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
    id: ChartId.TextHabitCoocurrencesChord,
    title: "Habits co-ocurrence",
    description: "See how often values in text habits co-occur",
    sources: [ChartSource.Habit],
    elements: [ChartElement.Chord],
  },
  {
    id: ChartId.Count,
    title: "Entry count",
    description: "Displays the number of entries collected from a source",
    sources: [ChartSource.Meta],
    elements: [ChartElement.Value],
  },
  {
    id: ChartId.CountriesVisitedMap,
    title: "Countries Visited Map",
    description: "Explore all the countries you visited in a given time period",
    sources: [ChartSource.Location],
    elements: [ChartElement.Geo],
  },
  {
    id: ChartId.CountriesVisitedBar,
    title: "Countries Visited (Bar)",
    description: "Explore all the countries you visited in a given time period",
    sources: [ChartSource.Location],
    elements: [ChartElement.Bar],
  },
  {
    id: ChartId.CountriesVisitedPie,
    title: "Countries Visited (Pie)",
    description: "Explore all the countries you visited in a given time period",
    sources: [ChartSource.Location],
    elements: [ChartElement.Pie],
  },
  {
    id: ChartId.CitiesVisitedBar,
    title: "Cities Visited (Bar)",
    description: "Explore all the cities you visited in a given time period",
    sources: [ChartSource.Location],
    elements: [ChartElement.Bar],
  },
  {
    id: ChartId.PlacesVisitCountBar,
    title: "Places visited (count)",
    description: "Explore all the places you visited in a given time period",
    sources: [ChartSource.Location],
    elements: [ChartElement.Bar],
  },
];

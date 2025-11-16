export enum ChartType {
  LineChart = "line",
  BarChart = "bar",
  AreaChart = "area",
}

export enum ChartSource {
  Weather = "weather",
  Habit = "habit",
  HeartRate = "heartRate",
}

export function stringToChartSource(str: string) {
  switch (str) {
    case "weather":
      return ChartSource.Weather;
    case "habit":
      return ChartSource.Habit;
    case "heartRate":
      return ChartSource.HeartRate;
    default:
      throw new Error(`Unknown chart source: ${str}`);
  }
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
        description: "Habit data manually tracked by the user",
      };
    case ChartSource.HeartRate:
      return {
        title: "Heart Rate",
        description: "Heart rate data from the user",
      };
  }
}

export const aggregationPeriods = ["month", "day", "week"] as const;
export const aggregationFunctions = ["avg", "max", "min", "median"] as const;

export type ChartAreaConfig = {
  id: string;
  xKey: string;
  aggregation?: {
    period: (typeof aggregationPeriods)[number];
    fun: (typeof aggregationFunctions)[number];
  };
  shapes: {
    id: string;
    isMain: boolean;
    source: ChartSource;
    yKey: string;
    type: ChartType;
  }[];
  // Used to display in the UI
  title: string;
};

export type ChartOption = {
  data: ChartAreaConfig;
  value: ChartAreaConfig["id"];
  label: string;
};

export const unitToLabel = (unit: string) => {
  const known: Record<string, string | undefined> = {
    celsius: "°C",
    percentage: "%",
    centimeters: "cm",
    millimeter: "mm",
    kmph: "km/h",
    meters: "m",
  };
  return known[unit] ?? "";
};

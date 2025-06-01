import { sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { habitsTable } from "../../models/Habit";
import { habitLabel } from "../habits/personal";
import type { HabitKeys } from "../importers/obsidian/personal";

export type KeyOption = {
  key: string;
  description: string;
  label: string;
  isDateColumn?: boolean;
  unit?: string;
};

export const weatherNumericKeys: KeyOption[] = [
  {
    key: "apparentTemperature",
    description: "Feels like temperature",
    label: "Apparent Temperature",
    unit: "celsius",
  },
  {
    key: "temperature2m",
    description: "Temperature at 2 meters",
    label: "Temperature 2m",
    unit: "celsius",
  },
  {
    key: "snowfall",
    description: "Amount of snowfall",
    label: "Snowfall",
    unit: "cm",
  },
  {
    key: "snowDepth",
    description: "Depth of snow on the ground",
    label: "Snow Depth",
    unit: "cm",
  },
  {
    key: "windSpeed100m",
    description: "Wind speed at 100 meters",
    label: "Wind Speed 100m",
    unit: "kmh",
  },
  {
    key: "windSpeed10m",
    description: "Wind speed at 10 meters",
    label: "Wind Speed 10m",
    unit: "kmh",
  },
  {
    key: "relativeHumidity2m",
    description: "Relative humidity at 2 meters",
    label: "Relative Humidity 2m",
    unit: "percent",
  },
  {
    key: "precipitation",
    description: "Amount of precipitation",
    label: "Precipitation",
    unit: "mm",
  },
  {
    key: "rain",
    description: "Amount of rain",
    label: "Rain",
    unit: "mm",
  },
  {
    key: "cloudCover",
    description: "Percentage of cloud cover",
    label: "Cloud Cover",
    unit: "percent",
  },
];

export const weatherPrimitiveKeys: KeyOption[] = [
  {
    key: "date",
    description: "Date of the record",
    label: "Date",
    isDateColumn: true,
  },
  ...weatherNumericKeys,
  {
    key: "id",
    description: "Unique identifier",
    label: "ID",
  },
];
export const habitsNumericKeys = async (): Promise<KeyOption[]> => {
  return db
    .select({
      key: habitsTable.key,
    })
    .from(habitsTable)
    .where(sql`${habitsTable.key} IS NOT NULL AND jsonb_typeof(value) = 'number'`)
    .groupBy(habitsTable.key)
    .then((keys) =>
      keys.map((k) => ({
        key: k.key,
        label: habitLabel[k.key as HabitKeys],
        description: habitLabel[k.key as HabitKeys],
      })),
    );
};

export const habitsPrimitiveKeys = async (): Promise<KeyOption[]> => {
  const dbKeys = await db
    .select({
      key: habitsTable.key,
    })
    .from(habitsTable)
    .where(sql`${habitsTable.key} IS NOT NULL AND (jsonb_typeof(value) = 'number' OR jsonb_typeof(value) = 'varchar')`)
    .groupBy(habitsTable.key)
    .then((keys) =>
      keys.map((k) => ({
        key: k.key,
        label: habitLabel[k.key as HabitKeys],
        description: habitLabel[k.key as HabitKeys],
      })),
    );
  const otherKeys = [
    {
      key: "date",
      description: "Date of the record",
      label: "Date",
      isDateColumn: true,
    },
    {
      key: "id",
      description: "Unique identifier",
      label: "ID",
    },
  ];

  return otherKeys.concat(dbKeys);
};

export const heartRateNumericKeys: KeyOption[] = [
  {
    key: "heartRate",
    description: "Heart rate",
    label: "Heart Rate",
    unit: "bpm",
  },
  {
    key: "heartRateMax",
    description: "Maximum heart rate",
    label: "Heart Rate Max",
    unit: "bpm",
  },
  {
    key: "heartRateMin",
    description: "Minimum heart rate",
    label: "Heart Rate Min",
    unit: "bpm",
  },
];

export const heartRatePrimitiveKeys: KeyOption[] = [
  {
    key: "startTime",
    description: "Start time of the record",
    label: "Start Time",
    isDateColumn: true,
  },
  {
    key: "endTime",
    description: "End time of the record",
    label: "End Time",
    isDateColumn: true,
  },
  ...heartRateNumericKeys,
  {
    key: "timezone",
    description: "Timezone of the record",
    label: "Timezone",
  },
  {
    key: "binUuid",
    description: "Bin UUID",
    label: "Bin UUID",
  },
];

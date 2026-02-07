import { DateTime } from "luxon";
import type { DateRange } from "../types/chartTypes";
import { HabitsService } from "./habits/habits";
import { LocationChartService } from "./locations/locations";
import { WeatherService } from "./weather";

interface TimelineActivity {
  title: string;
  description?: string | null;
  source: string;
  type: "location" | "weather" | "habit";
  startDate: string;
  endDate?: string | undefined | null;
  timezone: string;
}

type TimelineActivityInternal = Omit<TimelineActivity, "startDate" | "endDate"> & {
  startDate: DateTime;
  endDate?: DateTime;
};

export namespace TimelineService {
  export async function listActivities(range: DateRange) {
    const [locations, habits, weathers] = await Promise.all([
      LocationChartService.getTimeline(range),
      HabitsService.list({ ...range, privateMode: false }),
      WeatherService.list(range),
    ]);

    const locationsFormatted: TimelineActivityInternal[] = locations.map((location) => ({
      title: location.placeOfInterest ? `At ${location.placeOfInterest.displayName}` : "Moving",
      description: location.placeOfInterest ? undefined : `Average ${location.velocity.toFixed(1)} km/h`,
      type: "location",
      source: "Owntracks",
      startDate: location.startDate
        ? DateTime.fromJSDate(location.startDate, { zone: location.timezone })
        : DateTime.invalid("Missing startDate"),
      endDate: location.endDate ? DateTime.fromJSDate(location.endDate, { zone: location.timezone }) : undefined,
      timezone: location.timezone,
    }));

    const habitsFormatted: TimelineActivityInternal[] = habits.map((habit) => ({
      title: `Tracked ${habit.key}`,
      description: HabitsService.formatValue(habit),
      type: "habit",
      source: habit.source,
      startDate: DateTime.fromJSDate(habit.date, {
        zone: habit.timezone,
      }),
      timezone: habit.timezone,
    }));

    const weatherFormatted: TimelineActivityInternal[] = weathers.map((weather) => ({
      title: WeatherService.weatherCodeToText(weather.weatherCode ?? -1),
      description: WeatherService.formatWeatherDescription(weather),
      type: "weather",
      source: "OpenWeather",
      startDate: DateTime.fromJSDate(weather.date, {
        zone: weather.timezone,
      }),
      timezone: weather.timezone,
    }));

    const sortedInternal = [...locationsFormatted, ...habitsFormatted].sort(
      (a, b) => a.startDate.toMillis() - b.startDate.toMillis(),
    );
    const sorted: TimelineActivity[] = sortedInternal.map((activity) => ({
      ...activity,
      startDate: activity.startDate.toUTC().toISO() ?? "",
      endDate: activity.endDate?.toUTC().toISO(),
    }));

    return sorted;
  }
}

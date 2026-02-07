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

export namespace TimelineService {
  export async function listActivities(range: DateRange) {
    const [locations, habits, weathers] = await Promise.all([
      LocationChartService.getTimeline(range),
      HabitsService.list({ ...range, privateMode: false }),
      WeatherService.list(range),
    ]);

    const locationsFormatted: TimelineActivity[] = locations.map((location) => ({
      title: location.placeOfInterest ? `At ${location.placeOfInterest.displayName}` : "Moving",
      description: location.placeOfInterest ? undefined : `Average ${location.velocity} km/h`,
      type: "location" as const,
      // TODO: how?
      source: "Owntracks",
      startDate: location.startDate ? (DateTime.fromISO(location.startDate).toISO() ?? "") : "",
      endDate: location.endDate ? (DateTime.fromISO(location.endDate).toISO() ?? undefined) : undefined,
      // TODO: how?
      timezone: "America/Toronto",
    }));

    const habitsFormatted: TimelineActivity[] = habits.map((habit) => ({
      title: habit.key,
      description: habit.comments ?? undefined,
      type: "habit" as const,
      source: habit.source,
      startDate: DateTime.fromJSDate(habit.date).toISO() ?? "",
      timezone: habit.timezone,
    }));
    const weatherFormatted: TimelineActivity[] = weathers.map((weather) => ({
      title: WeatherService.weatherCodeToText(weather.weatherCode ?? -1),
      description: WeatherService.formatWeatherDescription(weather),
      type: "weather",
      // How?
      source: "OpenWeather",
      startDate: DateTime.fromJSDate(weather.date).toISO() ?? "",
      timezone: weather.timezone,
    }));

    return [...locationsFormatted, ...habitsFormatted, ...weatherFormatted].sort((a, b) =>
      a.startDate < b.startDate ? 0 : 1,
    );
  }
}

import { DateTime } from "luxon";
import type { DateRange } from "../types/chartTypes";
import { HabitsService } from "./habits/habits";
import { LocationChartService } from "./locations/locations";
import { WeatherService } from "./weather";

interface TimelineActivity {
  title: string;
  description?: string;
  source: string;
  type: "location" | "weather" | "habit";
  startDate: Date;
  endDate?: Date;
}

export namespace TimelineService {
  export async function listActivities(range: DateRange) {
    const [locations, habits, weather] = await Promise.all([
      LocationChartService.getTimeline(range),
      HabitsService.list({ ...range, privateMode: false }),
      WeatherService.list(range),
    ]);

    const locationsFormatted: TimelineActivity[] = locations.map((location) => ({
      title: location.placeOfInterest ? `At ${location.placeOfInterest.displayName}` : "Moving",
      description: location.placeOfInterest ? undefined : `Average ${location.velocity} km/h`,
      type: "location",
      // TODO: how?
      source: "Owntracks",
      startDate: location.startDate ? DateTime.fromISO(location.startDate) : 0,
      endDate: location.endDate ? DateTime.fromISO(location.endDate) : undefined,
    }));

    const habitsFormatted: TimelineActivity[] = habits.map((habit) => ({
      title: habit.key,
      description: habit.comments,
      type: "habit",
      source: habit.source,
      startDate: DateTime.fromJSDate(habit.date),
    }));
  }
}

import { DateTime } from "luxon";
import type { Habit, Sleep, SleepStage } from "../models";
import type { Exercise } from "../models/Exercise";
import type { Website } from "../models/Website";
import type { WebsiteVisit } from "../models/WebsiteVisit";
import { BrowserHistoryService } from "./browserHistory";
import { ExerciseService } from "./exercise";
import { HabitsService } from "./habits/habits";
import { LocationChartService, type LocationTimelineActivity } from "./locations/locations";
import { SleepService } from "./sleep";

type TimelineActivity =
  | {
      date: string;
      type: "location";
      data: LocationTimelineActivity;
    }
  | {
      date: string;
      type: "habit";
      data: Habit;
    }
  | {
      date: string;
      type: "sleep";
      data: { sleep: Sleep; sleepStages: SleepStage[] };
    }
  | {
      date: string;
      type: "exercise";
      data: Exercise;
    }
  | {
      date: string;
      type: "websiteVisit";
      data: { website: Website; visit: WebsiteVisit };
    };

export namespace TimelineService {
  export async function listActivities(
    day: string,
    filtersParam?: {
      habit: boolean;
      location: boolean;
      website: boolean;
      sleep: boolean;
      exercise: boolean;
    },
  ) {
    const filters = filtersParam ?? { habit: true, location: true, website: true, sleep: true, exercise: true };
    const [locations, habits, browserHistory, sleep, exercises] = await Promise.all([
      filters.location ? LocationChartService.getTimeline(day) : [],
      filters.habit ? HabitsService.list({ day, privateMode: false }) : [],
      filters.website ? BrowserHistoryService.list({ day }) : [],
      filters.sleep ? SleepService.getDay({ day }) : [],
      filters.exercise ? ExerciseService.getByDay({ day }) : [],
    ]);

    const locationsFormatted: TimelineActivity[] = locations.map((location) => {
      if (!location.startDate) {
        throw new Error("Location missing start date");
      }
      const iso = DateTime.fromJSDate(location.startDate).toISO();
      if (!iso) {
        throw new Error("Location missing start date (couldn't parse iso)");
      }
      return {
        type: "location",
        date: iso,
        data: location,
      };
    });

    const habitsFormatted: TimelineActivity[] = habits.map((habit) => {
      const date = HabitsService.getTimeForPeriod(DateTime.fromJSDate(habit.date), habit.periodOfDay);
      const iso = date.toISO();
      if (!iso) {
        throw new Error("Location missing start date (couldn't parse iso)");
      }
      return {
        type: "habit",
        date: iso,
        data: {
          ...habit,
          // Just to help displaying on the FE, not sure how I want to do this long term
          date: date.toJSDate(),
        },
      };
    });

    const browserHistoryFormatted: TimelineActivity[] = browserHistory.map((history) => {
      const iso = DateTime.fromJSDate(history.visit.recordedAt).toISO();
      if (!iso) {
        throw new Error("Location missing start date (couldn't parse iso)");
      }
      return {
        type: "websiteVisit",
        date: iso,
        data: history,
      };
    });

    const sleepFormatted: TimelineActivity[] = sleep.map((s) => {
      const iso = DateTime.fromJSDate(s.sleep.startedAt).toISO();
      if (!iso) {
        throw new Error("Location missing start date (couldn't parse iso)");
      }
      return {
        type: "sleep",
        date: iso,
        data: s,
      };
    });

    const exercisesFormatted: TimelineActivity[] = exercises.map((s) => {
      const iso = DateTime.fromJSDate(s.startedAt).toISO();
      if (!iso) {
        throw new Error("Location missing start date (couldn't parse iso)");
      }
      return {
        type: "exercise",
        date: iso,
        data: s,
      };
    });

    const sorted = [
      ...locationsFormatted,
      ...habitsFormatted,
      ...browserHistoryFormatted,
      ...sleepFormatted,
      ...exercisesFormatted,
    ].sort((a, b) => DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis());

    return { activities: sorted, count: sorted.length };
  }
}

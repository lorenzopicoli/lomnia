import { DateTime } from "luxon";
import type { Habit } from "../models";
import type { Website } from "../models/Website";
import type { WebsiteVisit } from "../models/WebsiteVisit";
import { BrowserHistoryService } from "./browserHistory";
import { HabitsService } from "./habits/habits";
import { LocationChartService, type LocationTimelineActivity } from "./locations/locations";

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
    },
  ) {
    const filters = filtersParam ?? { habit: true, location: true, website: true };
    const [locations, habits, browserHistory] = await Promise.all([
      filters.location ? LocationChartService.getTimeline(day) : [],
      filters.habit ? HabitsService.list({ day, privateMode: false }) : [],
      filters.website ? BrowserHistoryService.list({ day }) : [],
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

    const browserHistoryFormatted: TimelineActivity[] = browserHistory
      .filter((history) => history.visit.timezone)
      .map((history) => {
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

    const sorted = [...locationsFormatted, ...habitsFormatted, ...browserHistoryFormatted].sort(
      (a, b) => DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis(),
    );

    return { activities: sorted, count: sorted.length };
  }
}

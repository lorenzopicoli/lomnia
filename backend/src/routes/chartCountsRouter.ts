import z from "zod";
import { BrowserHistoryChartService } from "../services/browserHistory";
import { DiaryEntriesService } from "../services/diaryEntries";
import { HabitsService } from "../services/habits/habits";
import { LocationChartService } from "../services/locations/locations";
import { WeatherChartService } from "../services/weather";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

const countKeys = [
  "totalWeatherEnties",
  "dailyWeatherEntries",
  "hourlyWeatherEntries",
  "totalLocationEntries",
  "totalFileEntries",
  "uniqueHabits",
  "totalHabitsEntries",
  "websites",
  "websitesVisits",
] as const;

export const chartCountsRouter = t.router({
  getCountKeys: loggedProcedure.query(async () => {
    return countKeys;
  }),
  getCounts: loggedProcedure
    .input(
      z
        .object({
          countKey: z.enum(countKeys),
        })
        .partial()
        .required({
          countKey: true,
        }),
    )
    .query((opts) => {
      switch (opts.input.countKey) {
        case "totalLocationEntries":
          return LocationChartService.getCount();
        case "dailyWeatherEntries":
          return WeatherChartService.getDailyCount();
        case "hourlyWeatherEntries":
          return WeatherChartService.getHourlyCount();
        case "totalWeatherEnties":
          return WeatherChartService.getTotalCount();
        case "totalFileEntries":
          return DiaryEntriesService.getCount();
        case "uniqueHabits":
          return HabitsService.uniqueHabitsCount();
        case "totalHabitsEntries":
          return HabitsService.getCount();
        case "websites":
          return BrowserHistoryChartService.getWebsitesCount();
        case "websitesVisits":
          return BrowserHistoryChartService.getWebsitesVisitsCount();
        default:
          return 0;
      }
    }),
});

import { chartCountsRouter } from "./chartCountsRouter";
import { diaryEntriesRouter } from "./diaryEntiesRouter";
import { habitsChartRouter, habitsRouter } from "./habitsRouter";
import { heartRateChartRouter } from "./heartRateRouter";
import { locationChartRouter } from "./locationRouter";
import { t } from "./trpc";
import { weatherChartRouter, weatherRouter } from "./weatherRouter";

export const appRouter = t.router({
  weather: weatherRouter,
  diaryEntries: diaryEntriesRouter,
  habits: habitsRouter,
  charts: {
    weather: weatherChartRouter,
    habits: habitsChartRouter,
    heartRate: heartRateChartRouter,
    locations: locationChartRouter,
    counts: chartCountsRouter,
  },
});

export type AppRouter = typeof appRouter;

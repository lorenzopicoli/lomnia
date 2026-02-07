import { browserHistoryChartRouter } from "./browserHistory";
import { chartCountsRouter } from "./chartCountsRouter";
import { dashboardsRouter } from "./dashboardsRouter";
import { diaryEntriesRouter } from "./diaryEntiesRouter";
import { habitFeaturesChartRouter, habitFeaturesRouter } from "./habitFeatureRouter";
import { habitsRouter } from "./habitsRouter";
import { heartRateChartRouter } from "./heartRateRouter";
import { locationChartRouter } from "./locationRouter";
import { placeOfInterestRouter } from "./placeOfInterestRouter";
import { timelineRouter } from "./timelineRouter";
import { t } from "./trpc";
import { weatherChartRouter, weatherRouter } from "./weatherRouter";

export const appRouter = t.router({
  weather: weatherRouter,
  diaryEntries: diaryEntriesRouter,
  habits: habitsRouter,
  habitFeatures: habitFeaturesRouter,
  dashboards: dashboardsRouter,
  placesOfInterest: placeOfInterestRouter,
  timelineRouter: timelineRouter,
  charts: {
    weather: weatherChartRouter,
    habits: habitFeaturesChartRouter,
    heartRate: heartRateChartRouter,
    locations: locationChartRouter,
    browserHistory: browserHistoryChartRouter,
    counts: chartCountsRouter,
  },
});

export type AppRouter = typeof appRouter;

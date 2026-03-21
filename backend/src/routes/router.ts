import { browserHistoryChartRouter } from "./browserHistory";
import { chartCountsRouter } from "./chartCountsRouter";
import { dashboardsRouter } from "./dashboardsRouter";
import { diaryEntriesRouter } from "./diaryEntiesRouter";
import { exerciseChartRouter, exerciseRouter } from "./exerciseRouter";
import { habitFeaturesChartRouter, habitFeaturesRouter } from "./habitFeatureRouter";
import { habitsRouter } from "./habitsRouter";
import { heartRateChartRouter, heartRateRouter } from "./heartRateRouter";
import { locationChartRouter, locationRouter } from "./locationRouter";
import { placeOfInterestRouter } from "./placeOfInterestRouter";
import { sleepsChartRouter, sleepsRouter } from "./sleepRouter";
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
  location: locationRouter,
  timelineRouter: timelineRouter,
  exercise: exerciseRouter,
  sleep: sleepsRouter,
  heartRate: heartRateRouter,
  charts: {
    weather: weatherChartRouter,
    habits: habitFeaturesChartRouter,
    exercise: exerciseChartRouter,
    heartRate: heartRateChartRouter,
    locations: locationChartRouter,
    browserHistory: browserHistoryChartRouter,
    counts: chartCountsRouter,
    sleep: sleepsChartRouter,
  },
});

export type AppRouter = typeof appRouter;

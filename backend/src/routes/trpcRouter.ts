import { initTRPC } from "@trpc/server";
import { DateTime } from "luxon";
import { z } from "zod";
import {
  habitsNumericKeys,
  habitsPrimitiveKeys,
  heartRateNumericKeys,
  heartRatePrimitiveKeys,
  weatherNumericKeys,
  weatherPrimitiveKeys,
} from "../services/charts/chartOptions";
import { getDiaryEntries } from "../services/diaryEntries";
import { getHabits, getHabitsCharts } from "../services/habits/habits";
import { getHeartRateCharts } from "../services/heartRates";
import { getHeatmapPoints, getLocationsTimeline } from "../services/locations";
import { getWeatherCharts, getWeatherInformation } from "../services/weather";

export const t = initTRPC.create();

export const loggedProcedure = t.procedure.use(async (opts) => {
  const start = Date.now();

  const result = await opts.next();

  const durationMs = Date.now() - start;
  const meta = { path: opts.path, type: opts.type, durationMs };

  result.ok ? console.log("OK request timing:", meta) : console.error("Non-OK request timing", meta);

  return result;
});

export const appRouter = t.router({
  getWeatherByDay: loggedProcedure.input(z.object({ day: z.string().date() })).query((opts) => {
    return getWeatherInformation({ day: opts.input.day });
  }),
  getDiaryEntriesByDay: loggedProcedure
    .input(
      z.object({
        day: z.string().date(),
        privateMode: z.boolean(),
      }),
    )
    .query((opts) => {
      return getDiaryEntries(opts.input);
    }),
  getHabitsByDay: loggedProcedure
    .input(
      z.object({
        day: z.string().date(),
        privateMode: z.boolean(),
      }),
    )
    .query((opts) => {
      return getHabits(opts.input);
    }),
  getHeatmap: loggedProcedure
    .input(
      z
        .object({
          topLeftLat: z.coerce.number(),
          topLeftLng: z.coerce.number(),
          bottomRightLat: z.coerce.number(),
          bottomRightLng: z.coerce.number(),
          zoom: z.coerce.number(),
          startDate: z.iso.datetime(),
          endDate: z.iso.datetime(),
        })
        .partial()
        .required({
          topLeftLat: true,
          topLeftLng: true,
          bottomRightLat: true,
          bottomRightLng: true,
          zoom: true,
        }),
    )
    .query(async (opts) => {
      const points = await getHeatmapPoints({
        ...opts.input,
        startDate: DateTime.fromISO(opts.input.startDate ?? ""),
        endDate: DateTime.fromISO(opts.input.endDate ?? ""),
      });
      return points.map((r) => [r.location.lng, r.location.lat, r.weight] as [number, number, number]);
    }),

  getVisitedPlaces: loggedProcedure
    .input(
      z.object({
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime(),
      }),
    )
    .query((opts) => {
      return getLocationsTimeline({
        startDate: DateTime.fromISO(opts.input.startDate, { zone: "UTC" }),
        endDate: DateTime.fromISO(opts.input.endDate, { zone: "UTC" }),
      });
    }),
  getWeatherCharts: loggedProcedure
    .input(
      z
        .object({
          startDate: z.iso.datetime(),
          endDate: z.iso.datetime(),
          xKey: z.string(),
          yKeys: z.array(z.string()),
          aggregation: z.object({
            fun: z.literal("avg").or(z.literal("median")).or(z.literal("max")).or(z.literal("min")),
            period: z
              .literal("month")
              .or(z.literal("week"))
              .or(z.literal("day").or(z.literal("hour"))),
          }),
        })
        .partial()
        .required({
          xKey: true,
          yKeys: true,
          startDate: true,
          endDate: true,
        }),
    )
    .query((opts) => {
      return getWeatherCharts({
        xKey: opts.input.xKey,
        yKeys: opts.input.yKeys,
        filters: {
          startDate: DateTime.fromISO(opts.input.startDate, { zone: "UTC" }),
          endDate: DateTime.fromISO(opts.input.endDate, { zone: "UTC" }),
        },
        aggregation: opts.input.aggregation,
      });
    }),
  getHeartRateCharts: loggedProcedure
    .input(
      z
        .object({
          startDate: z.iso.datetime(),
          endDate: z.iso.datetime(),
          xKey: z.string(),
          yKeys: z.array(z.string()),
          aggregation: z.object({
            fun: z.literal("avg").or(z.literal("median")).or(z.literal("max")).or(z.literal("min")),
            period: z.literal("month").or(z.literal("week")).or(z.literal("day")),
          }),
        })
        .partial()
        .required({
          xKey: true,
          yKeys: true,
          startDate: true,
          endDate: true,
        }),
    )
    .query((opts) => {
      return getHeartRateCharts({
        xKey: opts.input.xKey,
        yKeys: opts.input.yKeys,
        filters: {
          startDate: DateTime.fromISO(opts.input.startDate, { zone: "UTC" }),
          endDate: DateTime.fromISO(opts.input.endDate, { zone: "UTC" }),
        },
        aggregation: opts.input.aggregation,
      });
    }),
  getHabitsCharts: loggedProcedure
    .input(
      z
        .object({
          startDate: z.iso.datetime(),
          endDate: z.iso.datetime(),
          xKey: z.string(),
          yKeys: z.array(z.string()),
          aggregation: z.object({
            fun: z.literal("avg").or(z.literal("median")).or(z.literal("max")).or(z.literal("min")),
            period: z.literal("month").or(z.literal("week")).or(z.literal("day")),
          }),
        })
        .partial()
        .required({
          xKey: true,
          yKeys: true,
          startDate: true,
          endDate: true,
        }),
    )
    .query((opts) => {
      return getHabitsCharts({
        xKey: opts.input.xKey,
        yKeys: opts.input.yKeys,
        filters: {
          startDate: DateTime.fromISO(opts.input.startDate, { zone: "UTC" }),
          endDate: DateTime.fromISO(opts.input.endDate, { zone: "UTC" }),
        },
        aggregation: opts.input.aggregation,
      });
    }),
  getAvailableKeys: loggedProcedure.query(async () => {
    return {
      xKeys: {
        weather: weatherPrimitiveKeys,
        habit: await habitsPrimitiveKeys(),
        heartRate: heartRatePrimitiveKeys,
      },
      yKeys: {
        weather: weatherNumericKeys,
        habit: await habitsNumericKeys(),
        heartRate: heartRateNumericKeys,
      },
    };
  }),
});

export type AppRouter = typeof appRouter;

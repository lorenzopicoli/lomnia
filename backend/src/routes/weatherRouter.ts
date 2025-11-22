import z from "zod";
import { WeatherChartService, WeatherService } from "../services/weather";
import { ChartPeriodInput } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const weatherRouter = t.router({
  getByDay: loggedProcedure.input(z.object({ day: z.iso.date() })).query((opts) => {
    return WeatherService.getByDay({ day: opts.input.day });
  }),
});

export const weatherChartRouter = t.router({
  getApparentVsActualTemp: loggedProcedure.input(ChartPeriodInput.required()).query((opts) => {
    return WeatherChartService.getHourlyApparentVsActualTemp(opts.input);
  }),
  getDailyPrecipitation: loggedProcedure.input(ChartPeriodInput.required()).query((opts) => {
    return WeatherChartService.getDailyPrecipitation(opts.input);
  }),
});

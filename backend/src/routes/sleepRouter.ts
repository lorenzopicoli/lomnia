import z from "zod";
import { SleepService } from "../services/sleep";
import { ChartPeriodInput } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const sleepsRouter = t.router({
  getSleepForDay: loggedProcedure
    .input(
      z.object({
        day: z.iso.date(),
      }),
    )
    .query((opts) => {
      return SleepService.getDay(opts.input) ?? [];
    }),
});

export const sleepsChartRouter = t.router({
  listStartEndAndDuration: loggedProcedure.input(ChartPeriodInput).query((opts) => {
    return SleepService.startEndAndDuration(opts.input) ?? [];
  }),
});

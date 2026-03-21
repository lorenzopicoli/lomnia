import z from "zod";
import { SleepService } from "../services/sleep";
import { ChartPeriodInput } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const sleepsRouter = t.router({
  getByDay: loggedProcedure
    .input(
      z.object({
        day: z.iso.date(),
      }),
    )
    .query((opts) => {
      return SleepService.getDay(opts.input) ?? [];
    }),
  getTable: loggedProcedure
    .input(
      z.object({
        page: z.number().min(0),
        search: z.string().optional(),
        limit: z.number().min(1),
      }),
    )
    .query((opts) => {
      return SleepService.getTableData(opts.input);
    }),
  getById: loggedProcedure.input(z.object({ id: z.number() })).query((opts) => {
    return SleepService.getById(opts.input.id) ?? [];
  }),
});

export const sleepsChartRouter = t.router({
  listStartEndAndDuration: loggedProcedure.input(ChartPeriodInput).query((opts) => {
    return SleepService.startEndAndDuration(opts.input) ?? [];
  }),
});

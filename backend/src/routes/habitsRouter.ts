import z from "zod";
import { HabitsService } from "../services/habits/habits";
import { DateRange } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const habitsRouter = t.router({
  getForPeriod: loggedProcedure.input(DateRange).query((opts) => {
    return HabitsService.getForPeriod(opts.input);
  }),
  getRawHabitsTable: loggedProcedure
    .input(
      z.object({
        page: z.number().min(0),
        search: z.string().optional(),
        limit: z.number().min(1),
      }),
    )
    .query((opts) => {
      return HabitsService.getRawHabits(opts.input) ?? [];
    }),
});

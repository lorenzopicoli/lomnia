import z from "zod";
import { HabitsService } from "../services/habits/habits";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const habitsRouter = t.router({
  getByDay: loggedProcedure
    .input(
      z.object({
        start: z.iso.datetime(),
        end: z.iso.datetime(),
        privateMode: z.boolean(),
      }),
    )
    .query((opts) => {
      return HabitsService.list(opts.input) ?? [];
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

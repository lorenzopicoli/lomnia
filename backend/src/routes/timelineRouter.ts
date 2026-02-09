import z from "zod";
import { TimelineService } from "../services/timeline";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const timelineRouter = t.router({
  listActivities: loggedProcedure
    .input(
      z.object({
        day: z.iso.date(),
        filters: z
          .object({
            habit: z.boolean(),
            location: z.boolean(),
            website: z.boolean(),
          })
          .optional(),
      }),
    )
    .query((opts) => {
      return TimelineService.listActivities(opts.input.day, opts.input.filters);
    }),
});

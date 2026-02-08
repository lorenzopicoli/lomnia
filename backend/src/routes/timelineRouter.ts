import { DateTime } from "luxon";
import z from "zod";
import { TimelineService } from "../services/timeline";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const timelineRouter = t.router({
  listActivities: loggedProcedure
    .input(
      z.object({
        start: z.iso.datetime(),
        end: z.iso.datetime(),
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
      return TimelineService.listActivities(
        {
          start: DateTime.fromISO(opts.input.start),
          end: DateTime.fromISO(opts.input.end),
        },
        opts.input.filters,
      );
    }),
});

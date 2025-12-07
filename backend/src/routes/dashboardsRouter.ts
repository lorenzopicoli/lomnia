import z from "zod";
import { DashboardSchema } from "../models/Dashboard";
import { DashboardService } from "../services/dashboards";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const dashboardsRouter = t.router({
  getAll: loggedProcedure.query(() => {
    return DashboardService.getAll() ?? [];
  }),
  get: loggedProcedure.input(z.number()).query((opts) => {
    return DashboardService.get(opts.input) ?? [];
  }),

  save: loggedProcedure
    .input(
      z.object({
        content: DashboardSchema,
        name: z.string().optional(),
        id: z.number().optional(),
      }),
    )
    .mutation(async (opts) => {
      const { name, id, content } = opts.input;
      const dashboard = {
        content,
        name,
      };
      if (id) {
        await DashboardService.update(id, dashboard);
      } else if (name) {
        const dashboard = {
          content,
          name,
        };
        await DashboardService.create(dashboard);
      }
    }),

  delete: loggedProcedure.input(z.number()).mutation(async (opts) => {
    await DashboardService.deleteDashboard(opts.input);
  }),
});

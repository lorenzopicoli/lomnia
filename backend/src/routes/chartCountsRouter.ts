import z from "zod";
import { LocationChartService } from "../services/locations";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const chartCountsRouter = t.router({
  getCountKeys: loggedProcedure.query(async () => {
    return ["totalWeatherEnties", "dailyWeatherEntries", "hourlyWeatherEntries", "totalLocationEntries"];
  }),
  getCounts: loggedProcedure
    .input(
      z
        .object({
          countKey: z.string(),
        })
        .partial()
        .required({
          countKey: true,
        }),
    )
    .query((opts) => {
      if (opts.input.countKey === "totalLocationEntries") {
        return LocationChartService.getCount();
      }
      return 10000;
    }),
});

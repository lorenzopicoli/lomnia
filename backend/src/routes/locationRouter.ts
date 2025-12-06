import z from "zod";
import { LocationChartService } from "../services/locations";
import { DateRange } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const locationRouter = t.router({});

export const locationChartRouter = t.router({
  getCount: loggedProcedure.input(z.object({ day: z.iso.date() })).query((_opts) => {
    return LocationChartService.getCount();
  }),

  getHeatmap: loggedProcedure.input(LocationChartService.HeatmapInput).query(async (opts) => {
    const points = await LocationChartService.getHeatmap(opts.input);
    return points.map((r) => [r.location.lng, r.location.lat, r.weight] as [number, number, number]);
  }),

  getVisitedPlaces: loggedProcedure.input(DateRange).query((opts) => {
    return LocationChartService.getVisitedPlaces(opts.input);
  }),

  getCountriesVisited: loggedProcedure.input(DateRange).query((opts) => {
    return LocationChartService.getCountriesVisited(opts.input);
  }),
});

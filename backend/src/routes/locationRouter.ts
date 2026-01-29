import z from "zod";
import { HeatmapInput, LocationChartService } from "../services/locations/locations";
import { DateRange } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const locationRouter = t.router({});

export const locationChartRouter = t.router({
  getCount: loggedProcedure.input(z.object({ day: z.iso.date() })).query((_opts) => {
    return LocationChartService.getCount();
  }),

  getHeatmap: loggedProcedure.input(HeatmapInput).query(async (opts) => {
    const points = await LocationChartService.getHeatmap(opts.input);
    return points.map((r) => [r.location.lng, r.location.lat, r.weight] as [number, number, number]);
  }),

  getTimeline: loggedProcedure.input(DateRange).query((opts) => {
    return LocationChartService.getTimeline(opts.input);
  }),

  getCountriesVisited: loggedProcedure.input(DateRange).query((opts) => {
    return LocationChartService.getCountriesVisited(opts.input);
  }),

  getCitiesVisited: loggedProcedure.input(DateRange).query((opts) => {
    return LocationChartService.getCitiesVisited(opts.input);
  }),

  getVisitCountsByPlace: loggedProcedure.input(DateRange).query(async (opts) => {
    const places = await LocationChartService.getVisitCountsByPlace(opts.input);

    return places.map((place) => ({
      ...place,
      // For now cap the length of the place visited name to 20 because
      // some nominatim names are huge
      name: place.name?.substring(0, 20),
    }));
  }),
});

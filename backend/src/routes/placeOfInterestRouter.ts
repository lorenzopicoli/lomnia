import z from "zod";
import { PlaceOfInterestService, PolygonFeatureSchema } from "../services/placeOfInterest";
import { reverseGeocode } from "../services/reverseGeocode/reverseGeocode";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

const placeOfInterestInputSchema = z.object({
  name: z.string().min(1),
  locationDetailsId: z.number().min(1),
  geoJson: z.any(),
});

export const placeOfInterestRouter = t.router({
  getCount: loggedProcedure.query(async () => {
    return PlaceOfInterestService.getCount();
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
      return PlaceOfInterestService.getTableData(opts.input);
    }),

  save: loggedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        ...placeOfInterestInputSchema.shape,
      }),
    )
    .mutation(async (opts) => {
      const { id, ...data } = opts.input;
      if (id) {
        await PlaceOfInterestService.update(id, data);
      } else {
        await PlaceOfInterestService.create(data);
      }
    }),

  delete: loggedProcedure.input(z.number()).mutation(async (opts) => {
    await PlaceOfInterestService.deletePoi(opts.input);
  }),

  getById: loggedProcedure.input(z.number().min(0)).query((opts) => {
    return PlaceOfInterestService.byId(opts.input);
  }),

  locationsCount: loggedProcedure.query(async () => {
    return PlaceOfInterestService.getLocationsCount();
  }),

  getAddressForPolygon: loggedProcedure
    .input(
      z.object({
        polygon: PolygonFeatureSchema,
      }),
    )
    .query(async (opts) => {
      return reverseGeocode(PlaceOfInterestService.getPlaceOfInterestCenter(opts.input.polygon));
    }),
});

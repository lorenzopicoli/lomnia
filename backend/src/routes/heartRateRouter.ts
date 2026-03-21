import { HeartRateChartService, HeartRateService } from "../services/heartRate";
import { ChartPeriodInput, DateRange } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const heartRateRouter = t.router({
  getForPeriod: loggedProcedure.input(DateRange).query((opts) => {
    return HeartRateService.getForPeriod(opts.input);
  }),
});
export const heartRateChartRouter = t.router({
  minMaxAvg: loggedProcedure.input(ChartPeriodInput.required()).query((opts) => {
    return HeartRateChartService.minMaxAvg(opts.input);
  }),
});

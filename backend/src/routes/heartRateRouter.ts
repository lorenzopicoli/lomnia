import { HeartRateChartService } from "../services/heartRate";
import { ChartPeriodInput } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const heartRateChartRouter = t.router({
  minMaxAvg: loggedProcedure.input(ChartPeriodInput.required()).query((opts) => {
    return HeartRateChartService.minMaxAvg(opts.input);
  }),
});

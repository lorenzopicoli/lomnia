import { BrowserHistoryChartService } from "../services/browserHistory";
import { DateRange } from "../types/chartTypes";
import { loggedProcedure } from "./common/loggedProcedure";
import { t } from "./trpc";

export const browserHistoryRouter = t.router({});

export const browserHistoryChartRouter = t.router({
  getMostVisitedPages: loggedProcedure.input(DateRange.required()).query(async (opts) => {
    const data = await BrowserHistoryChartService.getMostVisitedPages(opts.input);
    return data.map((d) => ({
      ...d,
      url:
        d.url.replace("http://", "").replace("https://", "").replace("www.", "").substring(0, 50) +
        (d.url.length > 50 ? "..." : ""),
    }));
  }),
  getMostVisitedHosts: loggedProcedure.input(DateRange.required()).query(async (opts) => {
    return BrowserHistoryChartService.getMostVisitedHosts(opts.input);
  }),
  websitesNavigationFlow: loggedProcedure.input(DateRange.required()).query(async (opts) => {
    return BrowserHistoryChartService.websitesNavigationFlow(opts.input);
  }),
  dailyVisits: loggedProcedure.input(DateRange.required()).query(async (opts) => {
    return BrowserHistoryChartService.dailyVisits(opts.input);
  }),
});

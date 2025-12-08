import type React from "react";
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { StringParam, useQueryParams } from "use-query-params";
import type { AggregationPeriod } from "../charts/types";
import { getAggFromPeriod } from "../utils/getAggFromPeriod";
import { getAggPeriodFromRange } from "../utils/getAggPeriodFromRange";
import { getRangeFromPeriod } from "../utils/getRangeFromPeriod";

export type Period = "week" | "month" | "year" | "all";

interface DashboardFiltersState {
  startDate: Date;
  endDate: Date;
  aggPeriod: AggregationPeriod;
  period: Period | null;

  setDateRange: (range: [Date, Date]) => void;
  setAggPeriod: (aggPeriod: AggregationPeriod) => void;
  onPeriodSelected: (id: Period) => void;
}

const DashboardFiltersContext = createContext<DashboardFiltersState | undefined>(undefined);

export const DashboardFiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [params, setParams] = useQueryParams({
    start: StringParam,
    end: StringParam,
    aggPeriod: StringParam,
    period: StringParam,
  });

  const setDateRange = (range: [Date, Date]) => {
    const aggPeriod = getAggPeriodFromRange(range);
    setParams({
      start: range[0].toISOString(),
      end: range[1].toISOString(),
      aggPeriod,
      period: null,
    });
  };

  const onPeriodSelected = useCallback(
    (id: Period) => {
      const aggPeriod = getAggFromPeriod(id);
      setParams({
        start: null,
        end: null,
        aggPeriod: aggPeriod,
        period: id,
      });
    },
    [setParams],
  );

  const setAggPeriod = useCallback(
    (aggPeriod: AggregationPeriod) => {
      setParams({ aggPeriod });
    },
    [setParams],
  );
  const aggPeriod = (params.aggPeriod ?? "day") as AggregationPeriod;
  const period = (params.period ?? null) as Period | null;
  const internalDateRange = useMemo(() => {
    if (params.start && params.end) {
      return { start: new Date(params.start), end: new Date(params.end) };
    }

    if (params.period) {
      const range = getRangeFromPeriod(params.period as Period);
      return { start: range[0], end: range[1] };
    }
    const defaultPeriod = "year";
    // period (not params.period) contains the default value
    const range = getRangeFromPeriod(defaultPeriod);
    onPeriodSelected(defaultPeriod);
    return { start: range[0], end: range[1] };
  }, [params.start, params.end, params, onPeriodSelected]);

  // Should always be available because on first load if nothing is in the URL we set period to year
  // which should set the range
  if (!internalDateRange) {
    return <>Loading...</>;
  }

  return (
    <DashboardFiltersContext.Provider
      value={{
        aggPeriod,
        setAggPeriod,
        setDateRange,
        onPeriodSelected,
        period,
        startDate: internalDateRange.start,
        endDate: internalDateRange.end,
      }}
    >
      {children}
    </DashboardFiltersContext.Provider>
  );
};

export const useDashboardFilters = () => {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) throw new Error("useDashboardFilters must be used within a DashboardFiltersContext provider");
  return ctx;
};

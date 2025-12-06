import { useToggle } from "@mantine/hooks";
import { subDays } from "date-fns";
import { differenceInDays } from "date-fns/differenceInDays";
import type React from "react";
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { StringParam, useQueryParams } from "use-query-params";
import type { AggregationPeriod } from "../charts/types";

export type Period = "week" | "month" | "year" | "all";

interface DashboardState {
  startDate: Date;
  endDate: Date;
  isRearranging: boolean;
  aggPeriod: AggregationPeriod;
  period: Period | null;

  setDateRange: (range: [Date, Date]) => void;
  toggleIsRearranging: () => void;
  setAggPeriod: (aggPeriod: AggregationPeriod) => void;
  onPeriodSelected: (id: Period) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

function getPeriod(id: Period): [Date, Date] {
  const today = new Date();
  switch (id) {
    case "week":
      return [subDays(today, 7), today];
    case "month":
      return [subDays(today, 30), today];
    case "year":
      return [subDays(today, 365), today];
    case "all":
      return [new Date("1970-01-01"), today];
  }
}

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [params, setParams] = useQueryParams({
    start: StringParam,
    end: StringParam,
    aggPeriod: StringParam,
    period: StringParam,
  });
  const [isRearranging, toggleIsRearranging] = useToggle([false, true]);

  const setDateRange = (range: [Date, Date]) => {
    let aggPeriod: AggregationPeriod = "day";
    const daysDiff = Math.abs(differenceInDays(range[0], range[1]));
    if (daysDiff <= 8) {
      aggPeriod = "hour";
    } else if (daysDiff <= 32) {
      aggPeriod = "day";
    } else if (daysDiff <= 800) {
      aggPeriod = "week";
    } else {
      aggPeriod = "month";
    }

    setParams({
      start: range[0].toISOString(),
      end: range[1].toISOString(),
      aggPeriod,
      period: null,
    });
  };

  const onPeriodSelected = useCallback(
    (id: Period) => {
      let aggPeriod: AggregationPeriod = "day";
      switch (id) {
        case "all":
          aggPeriod = "month";
          break;
        case "year":
          aggPeriod = "week";
          break;
        case "month":
          aggPeriod = "day";
          break;
        case "week":
          aggPeriod = "hour";
          break;
      }

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

  const internalDateRange = useMemo(() => {
    if (params.start && params.end) {
      return { start: new Date(params.start), end: new Date(params.end) };
    }

    if (params.period) {
      const range = getPeriod(params.period as Period);

      return { start: range[0], end: range[1] };
    }

    onPeriodSelected("year");
  }, [params.start, params.period, params.end, onPeriodSelected]);

  const aggPeriod = (params.aggPeriod ?? "day") as AggregationPeriod;
  const period = (params.period as Period) ?? null;

  if (!internalDateRange) {
    return <>Loading...</>;
  }

  return (
    <DashboardContext.Provider
      value={{
        aggPeriod,
        setAggPeriod,
        isRearranging,
        toggleIsRearranging,
        setDateRange,
        onPeriodSelected,
        period,
        startDate: internalDateRange.start,
        endDate: internalDateRange.end,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardContext provider");
  return ctx;
};

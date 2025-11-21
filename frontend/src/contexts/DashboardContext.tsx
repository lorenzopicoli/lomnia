import { useToggle } from "@mantine/hooks";
import { subDays } from "date-fns";
import { differenceInDays } from "date-fns/differenceInDays";
import type React from "react";
import { createContext, type ReactNode, useContext, useRef, useState } from "react";
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

function readParams() {
  const params = new URLSearchParams(window.location.search);

  const period = params.get("period") as Period | null;

  if (period) {
    return {
      startDate: null,
      endDate: null,
      agg: (params.get("period") as AggregationPeriod) || "week",
      period,
    };
  }

  const start = params.get("start");
  const end = params.get("end");

  const startDate = start ? new Date(start) : subDays(new Date(), 365);
  const endDate = end ? new Date(end) : new Date();

  return {
    startDate,
    endDate,
    agg: (params.get("period") as AggregationPeriod) || "week",
    period: null,
  };
}

function writePeriod(period: Period, aggPeriod: AggregationPeriod) {
  const params = new URLSearchParams();
  params.set("period", period);
  params.set("aggPeriod", aggPeriod);

  window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
}

function writeStartEnd(start: Date, end: Date, aggPeriod: AggregationPeriod) {
  const params = new URLSearchParams();
  params.set("start", start.toISOString().slice(0, 10));
  params.set("end", end.toISOString().slice(0, 10));
  params.set("aggPeriod", aggPeriod);

  window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
}

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
  const initial = readParams();

  const initialRange: [Date, Date] = initial.period ? getPeriod(initial.period) : [initial.startDate, initial.endDate];

  const didInitRef = useRef(false);

  const [dateRange, setDateRangeInternal] = useState<[Date, Date]>(initialRange);
  const [period, setPeriod] = useState<Period | null>(initial.period);

  const [isRearranging, toggleIsRearranging] = useToggle([false, true]);
  const [aggPeriod, setAggPeriod] = useState<AggregationPeriod>(initial.agg);

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

    setAggPeriod(aggPeriod);
    setPeriod(null);
    setDateRangeInternal(range);

    if (didInitRef.current) {
      writeStartEnd(range[0], range[1], aggPeriod);
    }
  };

  const onPeriodSelected = (id: Period) => {
    const range = getPeriod(id);
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

    setPeriod(id);
    setAggPeriod(aggPeriod);
    setDateRangeInternal(range);

    if (didInitRef.current) {
      writePeriod(id, aggPeriod);
    }
  };

  if (!didInitRef.current) {
    didInitRef.current = true;
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
        startDate: dateRange[0],
        endDate: dateRange[1],
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

import { useToggle } from "@mantine/hooks";
import { subDays } from "date-fns";
import type React from "react";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { AggregationPeriod } from "../charts/types";

interface DashboardState {
  startDate: Date;
  endDate: Date;
  isRearranging: boolean;
  aggPeriod: AggregationPeriod;
  setDateRange: (range: [Date, Date]) => void;
  toggleIsRearranging: () => void;
  setAggPeriod: (aggPeriod: AggregationPeriod) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

function readParams() {
  const params = new URLSearchParams(window.location.search);

  const start = params.get("start");
  const end = params.get("end");
  const period = params.get("period");

  const startDate = start ? new Date(start) : subDays(new Date(), 365);
  const endDate = end ? new Date(end) : new Date();
  const agg: AggregationPeriod = (period as AggregationPeriod) || "week";

  return { startDate, endDate, agg };
}

function writeParams(start: Date, end: Date, period: AggregationPeriod) {
  const params = new URLSearchParams(window.location.search);
  params.set("start", start.toISOString().slice(0, 10));
  params.set("end", end.toISOString().slice(0, 10));
  params.set("period", period);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = readParams();

  const [dateRange, setDateRange] = useState<[Date, Date]>([initial.startDate, initial.endDate]);
  const [isRearranging, toggleIsRearranging] = useToggle([false, true]);
  const [aggPeriod, setAggPeriod] = useState<AggregationPeriod>(initial.agg);

  useEffect(() => {
    writeParams(dateRange[0], dateRange[1], aggPeriod);
  }, [dateRange, aggPeriod]);

  return (
    <DashboardContext.Provider
      value={{
        aggPeriod,
        setAggPeriod,
        isRearranging,
        toggleIsRearranging,
        setDateRange,
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

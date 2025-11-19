import { useToggle } from "@mantine/hooks";
import { subDays } from "date-fns/subDays";
import type React from "react";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { AggregationPeriod } from "../charts/types";

interface ChartsConfig {
  startDate: Date;
  endDate: Date;
  isRearranging: boolean;
  aggPeriod: AggregationPeriod;
  setDateRange: (range: [Date, Date]) => void;
  toggleIsRearranging: () => void;
  setAggPeriod: (aggPeriod: AggregationPeriod) => void;
}
interface ChartsConfigContextType extends ChartsConfig {}

const ChartsConfigContext = createContext<ChartsConfig | undefined>(undefined);

export const ChartsConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dateRange, setDateRange] = useState<[Date, Date]>([subDays(new Date(), 365), new Date()]);
  const [isRearranging, toggleIsRearranging] = useToggle([false, true]);
  const [aggPeriod, setAggPeriod] = useState<AggregationPeriod>("week");

  return (
    <ChartsConfigContext.Provider
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
    </ChartsConfigContext.Provider>
  );
};

export const useChartsConfig = (): ChartsConfigContextType => {
  const context = useContext(ChartsConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

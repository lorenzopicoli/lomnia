import { useLocalStorage } from "@mantine/hooks";
import type React from "react";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { NumberParam, useQueryParams } from "use-query-params";

export type Period = "week" | "month" | "year" | "all";

interface DashboardState {
  isConfiguring: boolean;
  dashboardId: number | null;

  setIsConfiguring: (state: boolean) => void;
  setDashboardId: (id: number) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

const LAST_DASHBOARD_KEY = "last-dashboard";
export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [params, setParams] = useQueryParams({
    dashboardId: NumberParam,
  });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [lastDashboardId, setLastDashboardId] = useLocalStorage<number | null>({
    key: LAST_DASHBOARD_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });

  const setDashboardId = useCallback(
    (dashboardId: number) => {
      setParams({ dashboardId });
      setLastDashboardId(dashboardId);
    },
    [setParams, setLastDashboardId],
  );
  const dashboardId = params.dashboardId ?? lastDashboardId ?? null;

  // Set initial dashboardId in params if it's available from local storage
  useEffect(() => {
    if (!params.dashboardId && lastDashboardId) {
      setDashboardId(lastDashboardId);
    }
  }, [params.dashboardId, lastDashboardId, setDashboardId]);

  return (
    <DashboardContext.Provider
      value={{
        isConfiguring,
        dashboardId,
        setDashboardId,
        setIsConfiguring,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useCurrentDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useCurrentDashboard must be used within a DashboardContext provider");
  return ctx;
};

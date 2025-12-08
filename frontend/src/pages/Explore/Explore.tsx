import { Container, Paper, ScrollArea } from "@mantine/core";
import { Route, Routes } from "react-router-dom";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { DashboardProvider } from "../../contexts/DashboardContext";
import { DashboardFiltersProvider } from "../../contexts/DashboardFiltersContext";
import { AddChart } from "./AddChart";
import { ChartsDashboard } from "./ChartsDashboard";

function ExploreInternal() {
  const { theme } = useConfig();

  return (
    <Paper p={0} component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Routes>
          <Route path={":dashboardId/add-chart"} element={<AddChart />} />
          <Route
            index
            element={
              <DashboardProvider>
                <DashboardFiltersProvider>
                  <ChartsDashboard />
                </DashboardFiltersProvider>
              </DashboardProvider>
            }
          />
        </Routes>
      </ScrollArea>
    </Paper>
  );
}

export function Explore() {
  return <ExploreInternal />;
}

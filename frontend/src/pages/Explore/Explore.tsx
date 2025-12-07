import { Container, Paper, ScrollArea } from "@mantine/core";
import { Route, Routes, useNavigate } from "react-router-dom";
import type { ChartAreaConfig } from "../../charts/types";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { DashboardProvider, useDashboard } from "../../contexts/DashboardContext";
import { AddChart } from "../AddChart/AddChart";
import { ChartsDashboard } from "./ChartsDashboard";

function ExploreInternal() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const { dashboardId } = useDashboard();
  const { onAddCharts } = useChartGridLayout(dashboardId);
  const handleAddChart = (chart: ChartAreaConfig) => {
    onAddCharts([chart]);
    // navigate("/explore");
  };

  const handleDismissAddChart = () => {
    navigate("/explore");
  };

  return (
    <Paper p={0} component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Routes>
          <Route index element={<ChartsDashboard />} />
          <Route path={"add-chart"} element={<AddChart onDismiss={handleDismissAddChart} onSave={handleAddChart} />} />
        </Routes>
      </ScrollArea>
    </Paper>
  );
}

export function Explore() {
  return (
    <DashboardProvider>
      <ExploreInternal />
    </DashboardProvider>
  );
}

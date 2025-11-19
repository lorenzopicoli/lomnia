import { Container, Paper, ScrollArea } from "@mantine/core";
import { Route, Routes, useNavigate } from "react-router-dom";
import type { ChartAreaConfig } from "../../charts/types";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { AddChart } from "../../components/AddChart/AddChart";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { DashboardProvider } from "../../contexts/DashboardContext";
import { ChartsDashboard } from "./ChartsDashboard";

export function Explore() {
  const { theme } = useConfig();
  const navigate = useNavigate();

  const { onAddCharts } = useChartGridLayout("explore");
  const handleAddChart = (chart: ChartAreaConfig) => {
    onAddCharts([chart]);
    navigate("/explore");
  };

  const handleDismissAddChart = () => {
    navigate("/explore");
  };

  return (
    <DashboardProvider>
      <Paper p={0} component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
        <ScrollArea h={safeScrollableArea} type="never">
          <Routes>
            <Route index element={<ChartsDashboard />} />
            <Route
              path={"add-chart"}
              element={<AddChart onDismiss={handleDismissAddChart} onSave={handleAddChart} />}
            />
          </Routes>
        </ScrollArea>
      </Paper>
    </DashboardProvider>
  );
}

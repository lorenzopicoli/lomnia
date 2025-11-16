import { Container, Paper, ScrollArea, useMantineTheme } from "@mantine/core";
import { Route, Routes, useNavigate } from "react-router-dom";
import type { ChartAreaConfig } from "../../charts/types";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { AddChart } from "../../components/AddChart/AddChart";
import { ChartsConfigProvider } from "../../contexts/ChartsConfigContext";
import { ChartsDashboard } from "./ChartsDashboard";

export function Explore() {
  const theme = useMantineTheme();
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
    <ChartsConfigProvider>
      <Paper p={0} component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
        <ScrollArea
          h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
          type="never"
        >
          <Routes>
            <Route index element={<ChartsDashboard />} />
            <Route
              path={"add-chart"}
              element={<AddChart onDismiss={handleDismissAddChart} onSave={handleAddChart} />}
            />
          </Routes>
        </ScrollArea>
      </Paper>
    </ChartsConfigProvider>
  );
}

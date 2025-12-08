import { notifications } from "@mantine/notifications";
import { useNavigate, useParams } from "react-router-dom";
import type { ChartAreaConfig } from "../../charts/types";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { AddChartContainer } from "../../containers/AddChart/AddChartContainer";
import { useConfig } from "../../contexts/ConfigContext";
import { useDashboardContent } from "../../hooks/useDashboardContent";

export function AddChart() {
  const navigate = useNavigate();
  const { theme } = useConfig();
  const { dashboardId: paramDashboardId } = useParams<{ dashboardId: string }>();
  const parsedDashboardId = paramDashboardId ? parseInt(paramDashboardId, 10) : null;
  const { dashboard, updateDashboardContent } = useDashboardContent(parsedDashboardId, {
    onSuccessfulSave: () => {
      notifications.show({
        color: theme.colors.green[9],
        title: "Chart added successfully",
        message: "",
      });
      navigate("/dashboard");
    },
  });
  const { onAddCharts } = useChartGridLayout(dashboard?.content ?? null, updateDashboardContent);

  const handleAddChart = (chart: ChartAreaConfig) => {
    onAddCharts([chart]);
  };

  const handleDismissAddChart = () => {
    navigate(-1);
  };

  return <AddChartContainer onDismiss={handleDismissAddChart} onSave={handleAddChart} />;
}

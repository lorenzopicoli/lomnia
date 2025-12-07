import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import type { ChartAreaConfig } from "../../charts/types";
import { type DashboardLayout, useChartGridLayout } from "../../charts/useChartGridLayout";
import { AddChartContainer } from "../../containers/AddChart/AddChartContainer";
import { useConfig } from "../../contexts/ConfigContext";

function AddChartInternal(props: { dashboardId: number; dashboardContent: any }) {
  const navigate = useNavigate();
  const { theme } = useConfig();
  const { dashboardId, dashboardContent } = props;
  const { mutate: saveChart } = useMutation(
    trpc.dashboards.save.mutationOptions({
      onSuccess: () => {
        notifications.show({
          color: theme.colors.green[9],
          title: "Chart added successfully",
          message: "",
        });
        navigate("/dashboard");
      },
    }),
  );
  const handleSaveDashboard = (layout: DashboardLayout) => {
    saveChart({ id: dashboardId, content: layout as any });
  };
  const { onAddCharts } = useChartGridLayout(dashboardContent ?? null, handleSaveDashboard);

  const handleAddChart = (chart: ChartAreaConfig) => {
    onAddCharts([chart]);
  };

  const handleDismissAddChart = () => {
    navigate(-1);
  };

  return <AddChartContainer onDismiss={handleDismissAddChart} onSave={handleAddChart} />;
}

export function AddChart() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const parsedDashboardId = dashboardId ? parseInt(dashboardId, 10) : null;

  const { data: dashboard } = useQuery(trpc.dashboards.get.queryOptions(parsedDashboardId ?? -1));

  if (!dashboard || !parsedDashboardId) {
    return <>Loading...</>;
  }

  return <AddChartInternal dashboardId={parsedDashboardId} dashboardContent={dashboard.content} />;
}

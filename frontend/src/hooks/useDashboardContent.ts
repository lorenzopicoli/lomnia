import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "../api/trpc";
import type { DashboardLayout } from "../charts/useChartGridLayout";

export function useDashboardContent(dashboardId: number | null) {
  const queryEnabled = dashboardId !== null;

  const {
    data: dashboard,
    isFetching,
    refetch,
  } = useQuery(
    trpc.dashboards.get.queryOptions(dashboardId ?? -1, {
      enabled: queryEnabled,
      gcTime: 0,
    }),
  );

  const { mutate: saveDashboard, isPending: isSaving } = useMutation(
    trpc.dashboards.save.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  const updateDashboardContent = (content: DashboardLayout) => {
    if (dashboardId) {
      saveDashboard({ id: dashboardId, content: content as any });
    }
  };

  return {
    dashboard,
    isLoading: isFetching,
    isSaving,
    updateDashboardContent,
    refetch,
  };
}

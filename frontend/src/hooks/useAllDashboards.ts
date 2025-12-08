import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "../api/trpc";
import { emptyDashboardContent } from "../charts/useChartGridLayout";
import { useCurrentDashboard } from "../contexts/DashboardContext";

export function useAllDashboards() {
  const { dashboardId, setDashboardId, setIsConfiguring } = useCurrentDashboard();

  const {
    data: allDashboards,
    refetch: refetchAllDashboards,
    isFetching: isFetchingAllDashboards,
  } = useQuery(trpc.dashboards.getAll.queryOptions());

  const { mutate: saveDashboard, isPending: isSaving } = useMutation(
    trpc.dashboards.save.mutationOptions({
      onSuccess: (data) => {
        refetchAllDashboards();
        if (data?.id) {
          setDashboardId(data.id);
        }
      },
    }),
  );

  const { mutate: deleteDashboard, isPending: isDeleting } = useMutation(
    trpc.dashboards.delete.mutationOptions({
      onSuccess: (_data, id) => {
        refetchAllDashboards();
        // Deleted current dashboard
        if (id === dashboardId) {
          // Switch to another dashboard
          const another = allDashboards?.find((d) => d.id !== dashboardId);
          if (another) {
            setDashboardId(another.id);
          }
          setIsConfiguring(false);
        }
      },
    }),
  );

  const createDashboard = (name = "New dashboard") => {
    saveDashboard({ name, content: emptyDashboardContent as any });
  };

  const renameDashboard = (name: string, id: number) => {
    saveDashboard({ name, id });
  };

  const removeDashboard = (id: number) => {
    deleteDashboard(id);
  };

  return {
    allDashboards,
    isFetchingAllDashboards,
    isSaving,
    isDeleting,
    createDashboard,
    renameDashboard,
    removeDashboard,
    refetchAllDashboards,
  };
}

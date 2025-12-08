import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
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

  const createDashboard = useCallback(
    (name = "New dashboard") => {
      saveDashboard({ name, content: emptyDashboardContent });
    },
    [saveDashboard],
  );

  const renameDashboard = (name: string, id: number) => {
    saveDashboard({ name, id });
  };

  const removeDashboard = (id: number) => {
    deleteDashboard(id);
  };

  // If no dashboards were found on the server and we aren't fetching (ie. we got an answer)
  // then force the creation of a first dashboard
  useEffect(() => {
    if (allDashboards?.length === 0 && !isFetchingAllDashboards) {
      createDashboard();
    }
  }, [isFetchingAllDashboards, createDashboard, allDashboards?.length]);
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

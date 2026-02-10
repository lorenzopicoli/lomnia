import { Flex, Tabs, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useEffect } from "react";
import { ChartDashboardMenu } from "../../components/ChartDashboardMenu/ChartDashboardMenu";
import { useCurrentDashboard } from "../../contexts/DashboardContext";
import { useAllDashboards } from "../../hooks/useAllDashboards";
import { ChartsDashboardItem } from "./ChartDashboardItem";
import { DashboardTabTab } from "./ChartDashboardTabTab";

export function ChartsDashboardList() {
  const { dashboardId, isConfiguring, setDashboardId } = useCurrentDashboard();
  const { allDashboards, createDashboard, renameDashboard, removeDashboard } = useAllDashboards();

  // Set the dashboard id to be the first one if nothing is coming from the context (should mean that this is the first ever load)
  // since nothing is even in local storage
  useEffect(() => {
    if (!dashboardId && allDashboards?.[0]) {
      setDashboardId(allDashboards[0].id);
    }
  }, [setDashboardId, dashboardId, allDashboards?.[0]]);

  if (!allDashboards) {
    return <>Loading...</>;
  }

  const handleNewDashboard = () => {
    createDashboard();
  };

  return (
    <Flex direction={"column"} gap={"sm"}>
        <ChartDashboardMenu />
      <Tabs keepMounted={false} value={String(dashboardId)} onChange={(value) => value && setDashboardId(+value)}>
        <Tabs.List>
          {allDashboards.map((dashboard) => (
            <Tabs.Tab
              disabled={isConfiguring && dashboardId !== dashboard.id}
              key={dashboard.id}
              value={String(dashboard.id)}
            >
              <DashboardTabTab
                dashboardName={dashboard.name}
                isEditing={isConfiguring && dashboardId === dashboard.id}
                onRename={(name) => renameDashboard(name, dashboard.id)}
                onRemove={() => removeDashboard(dashboard.id)}
              />
            </Tabs.Tab>
          ))}
          {isConfiguring || allDashboards.length === 0 ? (
            <Tabs.Tab onClick={handleNewDashboard} leftSection={<IconPlus />} value="##new-dashboard">
              Add Dashboard
            </Tabs.Tab>
          ) : null}
        </Tabs.List>

        {allDashboards.map((dashboard) => (
          <Tabs.Panel key={dashboard.id} value={String(dashboard.id)}>
            <ChartsDashboardItem dashboardId={dashboard.id} />
          </Tabs.Panel>
        ))}
      </Tabs>
    </Flex>
  );
}

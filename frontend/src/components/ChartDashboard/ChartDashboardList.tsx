import { ActionIcon, alpha, Flex, Group, Tabs, Text, TextInput } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { type ChangeEvent, useEffect } from "react";
import { ChartDashboardMenu } from "../../components/ChartDashboardMenu/ChartDashboardMenu";
import { useConfig } from "../../contexts/ConfigContext";
import { useCurrentDashboard } from "../../contexts/DashboardContext";
import { useDashboardOperations } from "../../hooks/useDashboardOperations";
import { ChartsDashboardItem } from "./ChartDashboardItem";

export function ChartsDashboardList() {
  const { theme } = useConfig();

  const { dashboardId, isConfiguring, setDashboardId } = useCurrentDashboard();
  const { allDashboards, isFetchingAllDashboards, createDashboard, renameDashboard, removeDashboard } =
    useDashboardOperations();
  const handleChangeDashboardName = useDebouncedCallback((e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (dashboardId) {
      renameDashboard(name, dashboardId);
    }
  }, 500);

  const handleRemoveDashboard = () => {
    if (dashboardId) {
      removeDashboard(dashboardId);
    }
  };

  // Set the dashboard id to be the first one if nothing is coming from the context (should mean that this is the first ever load)
  // since nothing is even in local storage
  useEffect(() => {
    if (!dashboardId && allDashboards?.[0]) {
      setDashboardId(allDashboards[0].id);
    }
  }, [setDashboardId, dashboardId, allDashboards?.[0]]);

  useEffect(() => {
    if (allDashboards?.length === 0 && !isFetchingAllDashboards) {
      createDashboard();
    }
  }, [isFetchingAllDashboards, createDashboard, allDashboards?.length]);

  if (!allDashboards) {
    return <>Loading...</>;
  }

  const handleNewDashboard = () => {
    createDashboard();
  };

  return (
    <Flex direction={"column"} gap={"sm"}>
      <Flex justify={"space-between"} align={"center"}>
        <Text fs={"italic"} opacity={0.4}>
          Lomnia
        </Text>
        <ChartDashboardMenu />
      </Flex>
      <Tabs keepMounted={false} value={String(dashboardId)} onChange={(value) => value && setDashboardId(+value)}>
        <Tabs.List>
          {allDashboards.map((dashboard) => (
            <Tabs.Tab
              disabled={isConfiguring && dashboardId !== dashboard.id}
              key={dashboard.id}
              value={String(dashboard.id)}
            >
              {isConfiguring && dashboardId === dashboard.id ? (
                <Group gap={"xs"}>
                  <TextInput
                    defaultValue={dashboard.name}
                    onClick={(e) => e.stopPropagation()} // prevent switching tabs while editing
                    size={"xs"}
                    onChange={handleChangeDashboardName}
                    styles={{
                      input: {
                        fontSize: "inherit",
                      },
                    }}
                  />
                  <ActionIcon
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleRemoveDashboard}
                    size={"lg"}
                    variant="light"
                  >
                    <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
                  </ActionIcon>
                </Group>
              ) : (
                dashboard.name
              )}
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

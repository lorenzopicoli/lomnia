import { ActionIcon, alpha, Flex, Group, Tabs, Text, TextInput } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useEffect } from "react";
import { trpc } from "../../api/trpc";
import { emptyDashboardContent } from "../../charts/useChartGridLayout";
import { ChartDashboardMenu } from "../../components/ChartDashboardMenu/ChartDashboardMenu";
import { useConfig } from "../../contexts/ConfigContext";
import { useCurrentDashboard } from "../../contexts/DashboardContext";
import { ChartsDashboardItem } from "./ChartDashboardItem";

export function ChartsDashboardList() {
  const { theme } = useConfig();

  const { dashboardId, isConfiguring, setDashboardId, setIsConfiguring } = useCurrentDashboard();
  const { data: backendData, refetch, isFetching } = useQuery(trpc.dashboards.getAll.queryOptions());
  const { mutate: saveDashboard } = useMutation(
    trpc.dashboards.save.mutationOptions({
      onSuccess: (data) => {
        refetch();
        if (data?.id) {
          setDashboardId(data.id);
        }
      },
    }),
  );
  const { mutate: deleteDashboard } = useMutation(
    trpc.dashboards.delete.mutationOptions({
      onSuccess: () => {
        refetch();
        const another = backendData?.find((d) => d.id !== dashboardId);
        if (another) {
          setDashboardId(another.id);
        }
        setIsConfiguring(false);
      },
    }),
  );
  const handleChangeDashboardName = useDebouncedCallback((e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (dashboardId) {
      saveDashboard({ name, id: dashboardId });
    }
  }, 500);

  const handleRemoveDashboard = () => {
    if (dashboardId) {
      deleteDashboard(dashboardId);
    }
  };

  // Set the dashboard id to be the first one if nothing is coming from the context (should mean that this is the first ever load)
  // since nothing is even in local storage
  useEffect(() => {
    if (!dashboardId && backendData?.[0]) {
      setDashboardId(backendData[0].id);
    }
  }, [backendData, setDashboardId, dashboardId]);

  useEffect(() => {
    if (backendData?.length === 0 && !isFetching) {
      saveDashboard({ name: "New dashboard", content: emptyDashboardContent as any });
    }
  }, [backendData?.length, saveDashboard, isFetching]);

  if (!backendData) {
    return <>Loading...</>;
  }

  const handleNewDashboard = () => {
    saveDashboard({ name: "New dashboard", content: emptyDashboardContent as any });
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
          {backendData.map((dashboard) => (
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
          {isConfiguring || backendData.length === 0 ? (
            <Tabs.Tab onClick={handleNewDashboard} leftSection={<IconPlus />} value="##new-dashboard">
              Add Dashboard
            </Tabs.Tab>
          ) : null}
        </Tabs.List>

        {backendData.map((dashboard) => (
          <Tabs.Panel key={dashboard.id} value={String(dashboard.id)}>
            <ChartsDashboardItem dashboardId={dashboard.id} />
          </Tabs.Panel>
        ))}
      </Tabs>
    </Flex>
  );
}

import { Flex, Tabs, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { trpc } from "../../api/trpc";
import { emptyDashboardContent } from "../../charts/useChartGridLayout";
import { ChartDashboardMenu } from "../../components/ChartDashboardMenu/ChartDashboardMenu";
import { useDashboard } from "../../contexts/DashboardContext";
import { ChartsDashboardItem } from "./ChartDashboardItem";

export function ChartsDashboardList() {
  const {
    startDate,
    dashboardId,
    setDashboardId,
    endDate,
    period,
    setDateRange,
    onPeriodSelected,
    toggleIsRearranging,
    isRearranging,
  } = useDashboard();
  const { data: backendData, refetch } = useQuery(trpc.dashboards.getAll.queryOptions());
  const { mutate: createDashboard } = useMutation(
    trpc.dashboards.save.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  useEffect(() => {
    if (!dashboardId && backendData?.[0]) {
      setDashboardId(backendData[0].id);
    }
  }, [backendData, setDashboardId, dashboardId]);
  // const [activeTab, setActiveTab] = useState<string | null>();

  if (!backendData) {
    return <>Loading...</>;
  }

  const handleNewDashboard = () => {
    createDashboard({ name: "New dashboard", content: emptyDashboardContent as any });
  };

  return (
    <Flex direction={"column"} gap={"sm"}>
      <Flex justify={"space-between"} align={"center"}>
        <Text fs={"italic"} opacity={0.4}>
          Lomnia
        </Text>
        <ChartDashboardMenu
          currentRange={[startDate, endDate]}
          currentPeriod={period}
          onDateChange={setDateRange}
          onPeriodSelected={onPeriodSelected}
          onRearrangeCharts={toggleIsRearranging}
        />
      </Flex>
      <Tabs value={String(dashboardId)} onChange={(value) => value && setDashboardId(+value)}>
        <Tabs.List>
          {backendData.map((dashboard) => (
            <Tabs.Tab key={dashboard.id} value={String(dashboard.id)}>
              {dashboard.name}
            </Tabs.Tab>
          ))}
          {isRearranging || backendData.length === 0 ? (
            <Tabs.Tab onClick={handleNewDashboard} leftSection={<IconPlus />} value="##new-dashboard">
              Add Dashboard
            </Tabs.Tab>
          ) : null}
        </Tabs.List>

        {backendData.map((dashboard) => (
          <Tabs.Panel key={dashboard.id} value={String(dashboard.id)}>
            <ChartsDashboardItem data={dashboard} />
          </Tabs.Panel>
        ))}
      </Tabs>
    </Flex>
  );
}

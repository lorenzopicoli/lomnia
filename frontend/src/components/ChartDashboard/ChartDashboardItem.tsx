import { ActionIcon, alpha, Container } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type RouterOutputs, trpc } from "../../api/trpc";
import { type DashboardLayout, useChartGridLayout } from "../../charts/useChartGridLayout";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { ResizableGrid } from "../../components/ResizableGrid/ResizableGrid";
import { useConfig } from "../../contexts/ConfigContext";
import { useCurrentDashboard } from "../../contexts/DashboardContext";
import { useDashboardFilters } from "../../contexts/DashboardFiltersContext";
import { removeNills } from "../../utils/removeNils";

function ChartsDashboardItemInternal(props: { data: RouterOutputs["dashboards"]["get"] }) {
  const { theme } = useConfig();
  const { data } = props;
  const { startDate, endDate, aggPeriod } = useDashboardFilters();
  const { isConfiguring } = useCurrentDashboard();
  const { mutate: saveDashboard } = useMutation(trpc.dashboards.save.mutationOptions());
  const handleSaveDashboard = (layout: DashboardLayout) => {
    saveDashboard({ id: data.id, content: layout as any });
  };
  const { chartsBeingShown, onRemoveChart, isChangingLayout, gridProps } = useChartGridLayout(
    data.content as any,
    handleSaveDashboard,
  );

  const charts = useMemo(() => {
    return Object.values(chartsBeingShown).filter(removeNills);
  }, [chartsBeingShown]);

  return charts.length > 0 ? (
    <ResizableGrid {...gridProps} isResizable={isConfiguring} isDraggable={isConfiguring} rowHeight={100}>
      {charts.map((chart) => (
        <div key={chart.uniqueId}>
          {isChangingLayout ? (
            <Container fluid h={"100%"} p={0} bg={theme.colors.dark[8]}>
              <ChartPlaceholder text={chart.title} />
            </Container>
          ) : (
            <Container fluid h={"100%"} p={0}>
              <Container fluid h={"100%"} p={0} opacity={isConfiguring ? 0.5 : 1}>
                <ChartDisplayer
                  {...chart}
                  chartId={chart.id}
                  startDate={startDate}
                  endDate={endDate}
                  aggPeriod={aggPeriod}
                />
              </Container>
              {isConfiguring ? (
                <Container pos={"absolute"} top={0} right={0} p={"sm"}>
                  <ActionIcon
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onRemoveChart(chart.uniqueId)}
                    size={"lg"}
                    variant="light"
                  >
                    <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
                  </ActionIcon>
                </Container>
              ) : null}
            </Container>
          )}
        </div>
      ))}
    </ResizableGrid>
  ) : null;
}

export function ChartsDashboardItem(props: { dashboardId: number }) {
  const { data: dashboard, isFetching } = useQuery(
    trpc.dashboards.get.queryOptions(props.dashboardId, {
      gcTime: 0,
    }),
  );

  if (!dashboard || isFetching) {
    return <>Loading...</>;
  }
  return <ChartsDashboardItemInternal data={dashboard} />;
}

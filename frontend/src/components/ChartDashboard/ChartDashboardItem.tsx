import { ActionIcon, alpha, Container } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { ResizableGrid } from "../../components/ResizableGrid/ResizableGrid";
import { useConfig } from "../../contexts/ConfigContext";
import { useCurrentDashboard } from "../../contexts/DashboardContext";
import { useDashboardFilters } from "../../contexts/DashboardFiltersContext";
import { useDashboardContent } from "../../hooks/useDashboardContent";
import { removeNills } from "../../utils/removeNils";

export function ChartsDashboardItem(props: { dashboardId: number }) {
  const { theme } = useConfig();
  const { dashboardId } = props;
  const { startDate, endDate, aggPeriod } = useDashboardFilters();
  const { isConfiguring } = useCurrentDashboard();
  const { dashboard, updateDashboardContent } = useDashboardContent(dashboardId);
  const { chartsBeingShown, onRemoveChart, isChangingLayout, gridProps } = useChartGridLayout(
    dashboard?.content ?? null,
    updateDashboardContent,
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

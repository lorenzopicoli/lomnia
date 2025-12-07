import { ActionIcon, Container } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import type { RouterOutputs } from "../../api/trpc";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { ResizableGrid } from "../../components/ResizableGrid/ResizableGrid";
import { useConfig } from "../../contexts/ConfigContext";
import { useDashboard } from "../../contexts/DashboardContext";
import { removeNills } from "../../utils/removeNils";

export function ChartsDashboardItem(props: { data: RouterOutputs["dashboards"]["getAll"][number] }) {
  const { theme } = useConfig();
  const { data } = props;
  const { startDate, endDate, aggPeriod, isRearranging } = useDashboard();
  const { chartsBeingShown, onRemoveChart, isChangingLayout, gridProps } = useChartGridLayout(data.id);
  const charts = useMemo(() => {
    return Object.values(chartsBeingShown).filter(removeNills);
  }, [chartsBeingShown]);

  return charts.length > 0 ? (
    <ResizableGrid {...gridProps} isResizable={isRearranging} isDraggable={isRearranging} rowHeight={100}>
      {charts.map((chart) => (
        <div key={chart.uniqueId}>
          {isChangingLayout ? (
            <Container fluid h={"100%"} p={0} bg={theme.colors.dark[8]}>
              <ChartPlaceholder text={chart.title} />
            </Container>
          ) : (
            <Container fluid h={"100%"} p={0}>
              <Container fluid h={"100%"} p={0} opacity={isRearranging ? 0.5 : 1}>
                <ChartDisplayer
                  {...chart}
                  chartId={chart.id}
                  startDate={startDate}
                  endDate={endDate}
                  aggPeriod={aggPeriod}
                />
              </Container>
              {isRearranging ? (
                <Container pos={"absolute"} top={0} right={0} p={0}>
                  <ActionIcon
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onRemoveChart(chart.uniqueId)}
                    size={"lg"}
                    variant="light"
                  >
                    <IconTrash size={20} />
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

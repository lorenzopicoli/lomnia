import { ActionIcon, Container, Paper, ScrollArea, Space } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartMenu } from "../../components/ChartMenu/ChartMenu";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { ResizableGrid } from "../../components/ResizableGrid/ResizableGrid";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { useDashboard } from "../../contexts/DashboardContext";
import { removeNills } from "../../utils/removeNils";

export function ChartsDashboard() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const chartsConfig = useDashboard();

  const { chartsBeingShown, onRemoveChart, isChangingLayout, gridProps } = useChartGridLayout("explore");
  const charts = useMemo(() => {
    return Object.values(chartsBeingShown).filter(removeNills);
  }, [chartsBeingShown]);

  const handleClickNewChart = useCallback(() => {
    navigate({
      pathname: "/explore/add-chart",
    });
  }, [navigate]);

  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Container fluid pt={"md"} pr={0} pl={0} m={0} style={{ position: "relative" }}>
          <ChartMenu
            selectedCharts={charts}
            currentRange={[chartsConfig.startDate, chartsConfig.endDate]}
            onDateChange={chartsConfig.setDateRange}
            onNewChart={handleClickNewChart}
            onRearrangeCharts={chartsConfig.toggleIsRearranging}
          />

          <Space h={50} />
          {charts.length > 0 ? (
            <ResizableGrid
              {...gridProps}
              isResizable={chartsConfig.isRearranging}
              isDraggable={chartsConfig.isRearranging}
              rowHeight={100}
            >
              {charts.map((chart) => (
                <div key={chart.uniqueId}>
                  {isChangingLayout ? (
                    <Container fluid h={"100%"} p={0} bg={theme.colors.dark[8]}>
                      <ChartPlaceholder text={chart.title} />
                    </Container>
                  ) : (
                    <Container fluid h={"100%"} p={0}>
                      <Container fluid h={"100%"} p={0} opacity={chartsConfig.isRearranging ? 0.5 : 1}>
                        <ChartDisplayer
                          {...chart}
                          chartId={chart.id}
                          startDate={chartsConfig.startDate}
                          endDate={chartsConfig.endDate}
                          aggPeriod={chartsConfig.aggPeriod}
                        />
                      </Container>
                      {chartsConfig.isRearranging ? (
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
          ) : null}
        </Container>
      </ScrollArea>
    </Paper>
  );
}

import { Container, Paper, ScrollArea, Space, useMantineTheme } from "@mantine/core";
import { subDays } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChartGridLayout } from "../../charts/useChartGridLayout";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartMenu } from "../../components/ChartMenu/ChartMenu";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { ResizableGrid } from "../../components/ResizableGrid/ResizableGrid";
import { removeNills } from "../../utils/removeNils";

export function ChartsDashboard() {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<[Date, Date]>([subDays(new Date(), 365), new Date()]);
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
      <ScrollArea
        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        type="never"
      >
        <Container fluid pt={"md"} pr={0} pl={0} m={0} style={{ position: "relative" }}>
          <ChartMenu
            selectedCharts={charts}
            onRemoveChart={onRemoveChart}
            currentRange={dateRange}
            onDateChange={setDateRange}
            onNewChart={handleClickNewChart}
          />

          <Space h={50} />
          {charts.length > 0 ? (
            <ResizableGrid {...gridProps} rowHeight={500}>
              {charts.map((chart) => (
                <div key={chart.uniqueId}>
                  {isChangingLayout ? (
                    <Container fluid h={"100%"} p={0} bg={theme.colors.dark[8]}>
                      <ChartPlaceholder text={chart.title} />
                    </Container>
                  ) : (
                    <Container fluid h={"100%"} p={0}>
                      <ChartDisplayer
                        chartId={chart.id}
                        startDate={dateRange[0]}
                        endDate={dateRange[1]}
                        aggPeriod={"day"}
                      />
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

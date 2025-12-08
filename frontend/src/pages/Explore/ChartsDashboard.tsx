import { Container, Paper, ScrollArea } from "@mantine/core";
import { ChartsDashboardList } from "../../components/ChartDashboard/ChartDashboardList";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";

export function ChartsDashboard() {
  const { theme } = useConfig();

  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Container fluid pt={"md"} pr={"md"} pl={"md"} m={0}>
          <ChartsDashboardList />
        </Container>
      </ScrollArea>
    </Paper>
  );
}

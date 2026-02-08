import { Container, Paper } from "@mantine/core";
import ActivityTimelineContainer from "../../containers/ActivityTimelineContainer";
import { useConfig } from "../../contexts/ConfigContext";

export default function TimelinePage() {
  const { theme } = useConfig();
  return (
    <Paper p={0} component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ActivityTimelineContainer />
    </Paper>
  );
}

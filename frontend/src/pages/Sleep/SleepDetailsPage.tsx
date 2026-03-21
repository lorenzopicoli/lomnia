import { Container, Paper, Stack } from "@mantine/core";
import { Route, Routes, useParams } from "react-router-dom";
import { SleepDetails } from "../../containers/SleepDetails";
import { useConfig } from "../../contexts/ConfigContext";

export function SleepDetailsPage() {
  const { theme } = useConfig();
  const { sleepId } = useParams<{ sleepId?: string }>();

  return (
    <Paper component={Container} fluid bg={theme.colors.dark[9]}>
      <Stack pt={"md"} h="100vh" style={{ overflow: "hidden" }}>
        <Routes>
          <Route index element={<SleepDetails id={parseInt(sleepId ?? "0", 10)} />} />
        </Routes>
      </Stack>
    </Paper>
  );
}

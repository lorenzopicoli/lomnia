import { Container, Paper, Stack } from "@mantine/core";
import { Route, Routes, useParams } from "react-router-dom";
import { smallContentMaxWidth } from "../../constants";
import { ExerciseDetails } from "../../containers/ExerciseDetails";
import { useConfig } from "../../contexts/ConfigContext";

export function ExerciseDetailsPage() {
  const { theme } = useConfig();
  const { exerciseId } = useParams<{ exerciseId?: string }>();

  return (
    <Paper component={Container} fluid bg={theme.colors.dark[9]}>
      <Stack ml={"auto"} mr={"auto"} maw={smallContentMaxWidth} pt={"md"} h="100vh" style={{ overflow: "hidden" }}>
        <Routes>
          <Route index element={<ExerciseDetails id={parseInt(exerciseId ?? "0", 10)} />} />
        </Routes>
      </Stack>
    </Paper>
  );
}

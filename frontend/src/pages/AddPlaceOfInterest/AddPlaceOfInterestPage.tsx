import { Container, Paper, ScrollArea } from "@mantine/core";
import { safeScrollableArea } from "../../constants";
import { AddPlaceOfInterestContainer } from "../../containers/AddPlaceOfInterest/AddPlaceOfInterestContainer";
import { useConfig } from "../../contexts/ConfigContext";

export function AddPlaceOfInterestPage() {
  const { theme } = useConfig();
  return (
    <Paper component={Container} p={0} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <AddPlaceOfInterestContainer />
      </ScrollArea>
    </Paper>
  );
}

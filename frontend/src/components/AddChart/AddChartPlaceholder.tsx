import { Center, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { IconZoomScan } from "@tabler/icons-react";

export function AddChartPlaceholder() {
  const theme = useMantineTheme();
  return (
    <Paper p="xl" radius="lg" bg={theme.colors.dark[8]} h={"100%"}>
      <Center h="100%">
        <Stack align="center">
          <IconZoomScan size={40} opacity={0.4} />
          <Text size="lg" fw={600} c="dimmed">
            No chart selected yet
          </Text>
          <Text c="dimmed" size="sm">
            Pick a source and a chart on the left.
          </Text>
        </Stack>
      </Center>
    </Paper>
  );
}

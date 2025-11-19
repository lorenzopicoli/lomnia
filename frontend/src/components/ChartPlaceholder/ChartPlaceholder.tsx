import { Center, Paper, Stack, Text } from "@mantine/core";
import { IconChartHistogram } from "@tabler/icons-react";
import { useConfig } from "../../contexts/ConfigContext";

export function ChartPlaceholder(props: { text?: string }) {
  const { theme } = useConfig();
  return (
    <Paper p="xl" radius="lg" bg={theme.colors.dark[8]} h={"100%"}>
      <Center h="100%">
        <Stack align="center">
          <IconChartHistogram size={40} opacity={0.4} />
          <Text size="lg" fw={600} c="dimmed">
            {props.text ? props.text : "Your chart will appear here"}
          </Text>
        </Stack>
      </Center>
    </Paper>
  );
}

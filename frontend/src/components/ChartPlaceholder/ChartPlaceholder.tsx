import { Center, Paper, Stack, Text } from "@mantine/core";
import { IconChartHistogram } from "@tabler/icons-react";
import { cardDarkBackground } from "../../themes/mantineThemes";

export function ChartPlaceholder(props: { text?: string; subText?: string; noBg?: boolean }) {
  return (
    <Paper p="xl" radius="lg" bg={props.noBg ? "transparent" : cardDarkBackground} h={"100%"}>
      <Center h="100%">
        <Stack align="center">
          <IconChartHistogram size={40} opacity={0.4} />
          <Text ta={"center"} size="lg" fw={600} c="dimmed">
            {props.text ? props.text : "Your chart will appear here"}
          </Text>

          {props.subText ? (
            <Text c="dimmed" size="sm">
              {props.subText}
            </Text>
          ) : null}
        </Stack>
      </Center>
    </Paper>
  );
}

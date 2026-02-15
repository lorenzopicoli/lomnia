import { Group, Text } from "@mantine/core";

export function ActivityTimelineTextValue(props: { text: string; value: string }) {
  const { text, value } = props;
  return (
    <Group gap={5}>
      <Text c="dimmed" size="sm">
        {text}:
      </Text>
      <Text size="sm">{value}</Text>
    </Group>
  );
}

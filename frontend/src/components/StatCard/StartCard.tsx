import { Paper, Stack, Text } from "@mantine/core";

export function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="lg" fw={600}>
          {value ?? "-"}
        </Text>
      </Stack>
    </Paper>
  );
}

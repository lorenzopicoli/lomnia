import { TZDate } from "@date-fns/tz";
import { Badge, Group, Stack, Text } from "@mantine/core";
import { IconNotes } from "@tabler/icons-react";
import { format } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { habitActivitySourceToIcon } from "./activitySourceToIcon";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "habit" }>;

export function formatValue(habit: Item["data"]): string {
  const { value, valuePrefix, valueSuffix } = habit;

  if (value === null || value === undefined) {
    return "";
  }

  let formatted: string;

  if (typeof value === "number") {
    formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.00$/, "");
  } else if (typeof value === "boolean") {
    formatted = value ? "Yes" : "No";
  } else if (typeof value === "string") {
    formatted = value.trim();
  } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    if (value.length === 0) {
      formatted = "None";
    } else if (value.length === 1) {
      formatted = value[0];
    } else {
      formatted = `${value.slice(0, -1).join(", ")} and ${value[value.length - 1]}`;
    }
  } else {
    try {
      formatted = JSON.stringify(value);
    } catch {
      formatted = String(value);
    }
  }

  const prefix = valuePrefix ? `${valuePrefix} ` : "";
  const suffix = valueSuffix ? ` ${valueSuffix}` : "";

  return `${prefix}${formatted}${suffix}`.trim();
}

export function HabitActivityTimelineItem(props: { activity: Item }) {
  const { activity } = props;
  const { data } = activity;

  const value = formatValue(data);

  const timeLabel = data.isFullDay
    ? "All day"
    : data.date
      ? format(new TZDate(data.date, data.timezone), "HH:mm")
      : null;

  return (
    <Stack gap={"md"}>
      <Group justify="space-between" gap="xs">
        <Group gap={"sm"}>
          {habitActivitySourceToIcon(activity.data.source)}

          <Text fw={500}>{data.key}</Text>
        </Group>

        {timeLabel && !data.periodOfDay && (
          <Text size="xs" c="dimmed">
            {timeLabel}
          </Text>
        )}
        {data.periodOfDay && (
          <Text size="xs" c="dimmed">
            {data.periodOfDay.replace("_", " ")}
          </Text>
        )}
      </Group>

      {value && (
        <Text size="sm" fw={600}>
          Value: {value}
        </Text>
      )}

      {data.comments && (
        <Group gap={6} mt={2} align="flex-start">
          <IconNotes size={14} />
          <Text size="sm" c="dimmed" lineClamp={2}>
            {data.comments}
          </Text>
        </Group>
      )}
      <Group gap="xs">
        <Badge variant="light" size="xs">
          Habit
        </Badge>
        <Badge variant="light" size="xs">
          {activity.data.source}
        </Badge>
      </Group>
    </Stack>
  );
}

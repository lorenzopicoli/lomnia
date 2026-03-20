import { TZDate } from "@date-fns/tz";
import { Group, Stack, Text } from "@mantine/core";
import { format } from "date-fns";
import { formatDate } from "../../utils/formatDate";
import { formatHabitValue } from "../../utils/formatHabitValue";
import { habitActivitySourceToIcon } from "../ActivityTimeline/ActivityTimelineItem/activitySourceToIcon";

type RawHabitRowProps = {
  source: string;
  habitKey: string;
  date: string;
  recordedAt: string | null;
  timezone: string;

  comments: string | null;

  valuePrefix: string | null;
  valueSuffix: string | null;

  periodOfDay: "morning" | "afternoon" | "evening" | "over_night" | null;
  isFullDay: boolean | null;
  value?: unknown;
};

export function RawHabitRow(props: RawHabitRowProps) {
  const {
    source,
    habitKey,
    date,
    recordedAt,
    timezone,
    comments,
    valuePrefix,
    valueSuffix,
    periodOfDay,
    isFullDay,
    value,
  } = props;

  const timeLabel = isFullDay ? "All day" : date ? format(new TZDate(date, timezone), "HH:mm:ss") : null;
  const formattedTimeLabel = timeLabel && !periodOfDay ? timeLabel : (periodOfDay ?? "").replace("_", " ");

  return (
    <Group p={3} justify="space-between" align="center">
      <Group align="flex-start" gap="md" flex={1}>
        {habitActivitySourceToIcon(source, 30)}

        <Stack gap={4} flex={1}>
          <Group justify="space-between">
            <Text fw={600}>{habitKey}</Text>

            <Text size="sm" c="dimmed">
              {`${formatDate(date, timezone, false)} - ${formattedTimeLabel}`}
            </Text>
          </Group>
          <Text size="sm">{formatHabitValue({ value, valuePrefix, valueSuffix })}</Text>

          {recordedAt && recordedAt !== date ? (
            <Text size="sm" c="dimmed">
              {`Recorded on ${formatDate(recordedAt, timezone)}`}
            </Text>
          ) : null}
          {comments ? (
            <Text size="sm" c="dimmed">
              {comments}
            </Text>
          ) : null}
        </Stack>
      </Group>
    </Group>
  );
}

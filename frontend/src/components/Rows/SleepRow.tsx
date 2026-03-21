import { TZDate } from "@date-fns/tz";
import { Group, Stack, Text } from "@mantine/core";
import { intervalToDuration } from "date-fns";
import type { RouterOutputs } from "../../api/trpc";
import { formatDate } from "../../utils/formatDate";
import { formatDateLong } from "../../utils/formatDateLong";
import { formatDurationShort } from "../../utils/formatDurationShort";
import { sleepActivitySourceToIcon } from "../ActivityTimeline/ActivityTimelineItem/activitySourceToIcon";
import { UnstyledLink } from "../UnstyledLink/UnstyledLink";

type Sleep = RouterOutputs["sleep"]["getTable"]["entries"][number];

export function SleepRow(props: Sleep) {
  const start = new TZDate(props.startedAt, props.timezone || "UTC");
  const end = new TZDate(props.endedAt, props.timezone || "UTC");

  const duration = intervalToDuration({
    start,
    end,
  });

  return (
    <UnstyledLink to={`/sleeps/${props.id}`}>
      <Group p={3} justify="space-between" align="center">
        <Group flex={1} align="flex-start" gap="md">
          {sleepActivitySourceToIcon(props.source, 30)}
          <Stack gap={4}>
            <Text fw={600}>{formatDateLong(props.endedAt, props.timezone ?? "UTC", false)}</Text>
            <Text size="sm" c="dimmed">
              {`Score: ${props.userScore || props.automaticScore}`}
            </Text>
          </Stack>
          <Text size="sm" c="dimmed">
            {formatDurationShort(duration, { skipSeconds: true })}
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          {formatDate(props.startedAt, props.timezone ?? "UTC", true)}
        </Text>
      </Group>
    </UnstyledLink>
  );
}

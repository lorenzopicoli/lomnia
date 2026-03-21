import { TZDate } from "@date-fns/tz";
import { Group, Stack, Text } from "@mantine/core";
import { intervalToDuration } from "date-fns";
import type { RouterOutputs } from "../../api/trpc";
import { formatDate } from "../../utils/formatDate";
import { formatDistance } from "../../utils/formatDistance";
import { formatDurationShort } from "../../utils/formatDurationShort";
import { formatExerciseType } from "../../utils/formatExerciseType";
import { exerciseActivitySourceToIcon } from "../ActivityTimeline/ActivityTimelineItem/activitySourceToIcon";
import { UnstyledLink } from "../UnstyledLink/UnstyledLink";

type Exercise = RouterOutputs["exercise"]["getTable"]["entries"][number];

export function ExerciseRow(props: Exercise) {
  const start = new TZDate(props.startedAt, props.timezone || "UTC");
  const end = new TZDate(props.endedAt, props.timezone || "UTC");

  const duration = intervalToDuration({
    start,
    end,
  });

  return (
    <UnstyledLink to={`/exercises/${props.id}/edit`}>
      <Group p={3} justify="space-between" align="center">
        <Group flex={1} align="flex-start" gap="md">
          {exerciseActivitySourceToIcon(props.source, 30)}
          <Stack gap={4}>
            <Text fw={600}>{props.name}</Text>
            <Text size="sm" c="dimmed">
              {formatExerciseType(props.type)}
            </Text>
            {props.distance ? (
              <Text size="sm" c="dimmed">
                {formatDistance(props.distance)}
              </Text>
            ) : null}
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

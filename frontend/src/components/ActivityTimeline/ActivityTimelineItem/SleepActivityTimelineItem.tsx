import { TZDate } from "@date-fns/tz";
import { Group, Progress, Stack, Text } from "@mantine/core";
import { format, intervalToDuration } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { formatDurationShort } from "../../../utils/formatDurationShort";
import { getSleepStagesTotals } from "../../../utils/getSleepStagesTotals";
import { ActivityTimelineTextValue } from "./ActivityTimelineTextValue";
import { sleepActivitySourceToIcon } from "./activitySourceToIcon";
import { BaseActivityTimelineItem } from "./BaseActivityTimelineItem";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "sleep" }>;

export function SleepActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { sleep, sleepStages } = activity.data;

  const timezone = sleep.timezone ?? "UTC";

  const start = new TZDate(sleep.startedAt, timezone);
  const end = new TZDate(sleep.endedAt, timezone);

  const totalMs = end.getTime() - start.getTime();
  const d = intervalToDuration({ start, end });
  const duration = formatDurationShort(d);
  const timeRange = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;

  const score = sleep.userScore ?? sleep.automaticScore;

  const stageTotals = getSleepStagesTotals(sleepStages, timezone);

  const stageOrder: Array<"deep" | "light" | "rem" | "awake"> = ["deep", "light", "rem", "awake"];

  const formatStageDuration = (ms: number) => {
    const d = intervalToDuration({ start: 0, end: ms });
    if (d.hours) return `${d.hours}h ${d.minutes ?? 0}m`;
    return `${d.minutes ?? 0}m`;
  };

  const title = "Sleep";

  return (
    <BaseActivityTimelineItem
      activity={activity}
      title={title}
      timezone={timezone}
      tags={["Sleep", sleep.source ?? ""]}
      overwriteTime={timeRange}
      activityPeriod={{
        start: sleep.startedAt,
        end: sleep.endedAt,
      }}
      renderCollapsed={() => (
        <Stack gap={4}>
          <ActivityTimelineTextValue text="Duration" value={duration} />
          <ActivityTimelineTextValue text="Score" value={String(score)} />
        </Stack>
      )}
      renderExpanded={() => (
        <Stack gap="xs">
          {stageOrder.map((stage) => {
            const value = stageTotals[stage];
            if (!value) return null;

            const percent = Math.round((value / totalMs) * 100);

            return (
              <Stack key={stage} gap={4}>
                <Group justify="space-between">
                  <Text size="sm" tt="capitalize">
                    {stage}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatStageDuration(value)} ({percent}%)
                  </Text>
                </Group>
                <Progress value={percent} size="sm" radius="xl" />
              </Stack>
            );
          })}
        </Stack>
      )}
      renderIcon={() => sleepActivitySourceToIcon(sleep.source)}
      externalLink={`/sleeps/${sleep.id}`}
      onExpand={onExpand}
      isExpanded={isExpanded}
    />
  );
}

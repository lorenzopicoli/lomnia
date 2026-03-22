import { TZDate } from "@date-fns/tz";
import { Stack } from "@mantine/core";
import { format, formatDistanceStrict } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { formatCadence } from "../../../utils/formatCadence";
import { formatExerciseType } from "../../../utils/formatExerciseType";
import { formatHeartRate } from "../../../utils/formatHeartRate";
import { ActivityTimelineTextValue } from "./ActivityTimelineTextValue";
import { exerciseActivitySourceToIcon } from "./activitySourceToIcon";
import { BaseActivityTimelineItem } from "./BaseActivityTimelineItem";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "exercise" }>;

export function ExerciseActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const exercise = activity.data;

  const timezone = exercise.timezone ?? "UTC";

  const start = new TZDate(exercise.startedAt, timezone);
  const end = new TZDate(exercise.endedAt, timezone);

  const duration = formatDistanceStrict(start, end);
  const timeRange = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;

  const title = formatExerciseType(exercise.exerciseType);

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatPace = (minPerKm: number) => {
    const min = Math.floor(minPerKm);
    const sec = Math.round(minPerKm % 60)
      .toString()
      .padStart(2, "0");

    return `${min}:${sec}/km`;
  };

  return (
    <BaseActivityTimelineItem
      activity={activity}
      title={title}
      timezone={timezone}
      tags={["Exercise", exercise.exerciseType, exercise.source ?? ""]}
      overwriteTime={timeRange}
      activityPeriod={{
        start: exercise.startedAt,
        end: exercise.endedAt,
      }}
      renderCollapsed={() => (
        <Stack gap={4}>
          {exercise.distance && <ActivityTimelineTextValue text="Distance" value={formatDistance(exercise.distance)} />}
          <ActivityTimelineTextValue text="Duration" value={duration} />

          {exercise.avgPace && <ActivityTimelineTextValue text="Avg pace" value={formatPace(exercise.avgPace)} />}
        </Stack>
      )}
      renderExpanded={() => (
        <Stack gap={4}>
          {exercise.avgHeartRate && (
            <ActivityTimelineTextValue text="Avg HR" value={formatHeartRate(exercise.avgHeartRate)} />
          )}

          {exercise.avgCadence && (
            <ActivityTimelineTextValue text="Cadence" value={formatCadence(exercise.avgCadence)} />
          )}
          {exercise.perceivedEffort && (
            <ActivityTimelineTextValue text="Perceived Effort" value={`${exercise.perceivedEffort}/100`} />
          )}
        </Stack>
      )}
      renderIcon={() => exerciseActivitySourceToIcon(exercise.source)}
      onExpand={onExpand}
      externalLink={`/exercises/${exercise.id}`}
      isExpanded={isExpanded}
    />
  );
}

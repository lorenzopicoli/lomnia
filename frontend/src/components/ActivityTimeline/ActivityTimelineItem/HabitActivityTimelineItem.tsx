import { TZDate } from "@date-fns/tz";
import { Stack } from "@mantine/core";
import { format } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { formatHabitValue } from "../../../utils/formatHabitValue";
import { ActivityTimelineTextValue } from "./ActivityTimelineTextValue";
import { habitActivitySourceToIcon } from "./activitySourceToIcon";
import { BaseActivityTimelineItem } from "./BaseActivityTimelineItem";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "habit" }>;

export function HabitActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { data } = activity;

  const value = formatHabitValue(data);

  const formattedTimeLabel = (withSeconds: boolean) => {
    const timeLabel = data.isFullDay
      ? "All day"
      : data.date
        ? format(new TZDate(data.date, data.timezone), withSeconds ? "HH:mm:ss" : "HH:mm")
        : null;
    return timeLabel && !data.periodOfDay ? timeLabel : (data.periodOfDay ?? "").replace("_", " ");
  };

  return (
    <BaseActivityTimelineItem
      activity={activity}
      title={data.key}
      timezone={data.timezone ?? ""}
      tags={["Habit", activity.data.source]}
      overwriteTime={formattedTimeLabel(false)}
      renderCollapsed={() => (
        <>
          {value && <ActivityTimelineTextValue text="Value" value={value} />}

          {data.comments && <ActivityTimelineTextValue text="Comments" value={data.comments} />}
        </>
      )}
      renderExpanded={() => (
        <Stack gap={"xs"}>
          {data.date && <ActivityTimelineTextValue text="Date" value={formattedTimeLabel(true)} />}
          {data.recordedAt && (
            <ActivityTimelineTextValue
              text="Logged on"
              value={format(new TZDate(data.recordedAt, data.timezone), "dd/MM/yyyy HH:mm:ss")}
            />
          )}
        </Stack>
      )}
      renderIcon={() => habitActivitySourceToIcon(activity.data.source)}
      onExpand={onExpand}
      isExpanded={isExpanded}
    />
  );
}
function formatValue(data: {
  valuePrefix: string | null;
  valueSuffix: string | null;
  source: string;
  key: string;
  id: number;
  date: string;
  createdAt: string | null;
  updatedAt: string | null;
  externalId: string | null;
  importJobId: number;
  timezone: string;
  comments: string | null;
  recordedAt: string | null;
  periodOfDay: "morning" | "afternoon" | "evening" | "over_night" | null;
  isFullDay: boolean | null;
  value?: unknown;
}) {
  throw new Error("Function not implemented.");
}

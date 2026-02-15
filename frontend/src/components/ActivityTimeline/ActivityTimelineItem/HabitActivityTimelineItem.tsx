import { TZDate } from "@date-fns/tz";
import { Stack } from "@mantine/core";
import { format } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { ActivityTimelineTextValue } from "./ActivityTimelineTextValue";
import { habitActivitySourceToIcon } from "./activitySourceToIcon";
import { BaseActivityTimelineItem } from "./BaseActivityTimelineItem";

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

export function HabitActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { data } = activity;

  const value = formatValue(data);

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

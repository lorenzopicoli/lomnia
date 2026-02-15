import { TZDate } from "@date-fns/tz";
import { Container, Text } from "@mantine/core";
import { format, formatDistanceStrict } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { MaximazibleMap } from "../../CommonMap";
import { locationActivitySourceToIcon } from "./activitySourceToIcon";
import { BaseActivityTimelineItem } from "./BaseActivityTimelineItem";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "location" }>;

export function LocationActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { data } = activity;

  const start = new TZDate(data.startDate, data.timezone);
  const end = new TZDate(data.endDate, data.timezone);

  const duration = formatDistanceStrict(start, end);
  const timeRange = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;

  const isStationary = !!data.placeOfInterest;

  return (
    <BaseActivityTimelineItem
      activity={activity}
      title={data.placeOfInterest?.displayName ?? (isStationary ? "Staying in place" : "Moving")}
      timezone={data.timezone ?? ""}
      overwriteTime={timeRange}
      tags={["Location", "Owntracks"]}
      renderCollapsed={() => (
        <>
          <Text size="sm" lineClamp={3}>
            {duration}
          </Text>

          {!isStationary && data.velocity > 0 && (
            <Text size="xs" c="dimmed">
              {Math.round(data.velocity)} km/h
            </Text>
          )}
        </>
      )}
      renderExpanded={() => (
        <>
          {activity.data.placeOfInterest?.geoJson ? (
            <Container style={{ overflow: "clip" }} bdrs={"lg"} w={"100%"} h={300} fluid p={0}>
              <MaximazibleMap
                readonlyPolygons={[
                  {
                    name: activity.data.placeOfInterest.displayName ?? "",
                    feature: activity.data.placeOfInterest.geoJson as any,
                  },
                ]}
              />
            </Container>
          ) : null}
        </>
      )}
      renderIcon={() => locationActivitySourceToIcon(null)}
      onExpand={onExpand}
      isExpanded={isExpanded}
    />
  );
}

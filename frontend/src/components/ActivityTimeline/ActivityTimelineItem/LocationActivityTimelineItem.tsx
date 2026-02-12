import { TZDate } from "@date-fns/tz";
import { Badge, Collapse, Container, Group, Stack, Text } from "@mantine/core";
import { format, formatDistanceStrict } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { ReadonlyPoiMap } from "../../PoiMaps/ReadonlyPoiMap";
import { locationActivitySourceToIcon } from "./activitySourceToIcon";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "location" }>;

export function LocationActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { data } = activity;

  const start = new TZDate(data.startDate, data.timezone);
  const end = new TZDate(data.endDate, data.timezone);

  const duration = formatDistanceStrict(start, end);
  const timeRange = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;

  const isStationary = !!data.placeOfInterest;

  console.log(activity.data.placeOfInterest);
  return (
    <Stack>
      <Group style={{ cursor: "pointer" }} align="center" gap="xs" wrap="nowrap" onClick={onExpand}>
        {locationActivitySourceToIcon(null)}
        <Text lineClamp={1} fw={500} flex={1}>
          {data.placeOfInterest?.displayName ?? (isStationary ? "Staying in place" : "Moving")}
        </Text>

        <Text size="xs" c="dimmed">
          {timeRange}
        </Text>
      </Group>
      <Group>
        <Text size="sm" lineClamp={3}>
          {duration}
        </Text>

        {!isStationary && data.velocity > 0 && (
          <Text size="xs" c="dimmed">
            {Math.round(data.velocity)} km/h
          </Text>
        )}
      </Group>
      <Collapse in={isExpanded}>
        {activity.data.placeOfInterest?.geoJson ? (
          <Container style={{ overflow: "clip" }} bdrs={"lg"} w={"100%"} h={300} fluid p={0}>
            <ReadonlyPoiMap
              readonlyPolygons={[
                {
                  name: activity.data.placeOfInterest.displayName ?? "",
                  feature: activity.data.placeOfInterest.geoJson as any,
                },
              ]}
            />
          </Container>
        ) : null}
      </Collapse>
      <Group gap="xs">
        <Badge variant="light" size="xs">
          Location
        </Badge>
        <Badge variant="light" size="xs">
          {"Owntracks"}
        </Badge>
      </Group>
    </Stack>
  );
}

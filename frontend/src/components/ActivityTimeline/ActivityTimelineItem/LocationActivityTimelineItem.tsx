import { Badge, Group, Stack, Text } from "@mantine/core";
import { format, formatDistanceStrict } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { locationActivitySourceToIcon } from "./activitySourceToIcon";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "location" }>;

export function LocationActivityTimelineItem(props: { activity: Item }) {
  const { activity } = props;
  const { data } = activity;

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  const duration = formatDistanceStrict(start, end);
  const timeRange = `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;

  const isStationary = !!data.placeOfInterest;

  return (
    <Stack>
      <Group gap="xs" justify="space-between" wrap="nowrap">
        <Group gap={"sm"}>
          {locationActivitySourceToIcon(null)}
          <Text lineClamp={1} fw={500}>
            {data.placeOfInterest?.displayName ?? (isStationary ? "Staying in place" : "Moving")}
          </Text>
        </Group>

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

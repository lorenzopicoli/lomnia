import { Text, Timeline } from "@mantine/core";
import { IconLocation } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { uniqueId } from "lodash";
import { trpc } from "../api/trpc";

type PlacesVisitedTimelineContainerProps = {
  date: Date;
  onFilterChange?: (endDate: Date) => void;
};

export default function PlacesVisitedTimelineContainer(props: PlacesVisitedTimelineContainerProps) {
  const { data, isLoading } = useQuery(
    trpc.timelineRouter.listActivities.queryOptions({
      start: startOfDay(props.date).toISOString(),
      end: endOfDay(props.date).toISOString(),
    }),
  );

  if (isLoading) {
    return "Loading...";
  }

  if (!data) {
    return null;
  }

  return (
    <Timeline bulletSize={24} lineWidth={2}>
      {data.map((place) => (
        <Timeline.Item key={uniqueId()} bullet={<IconLocation size={12} />} title={place.title}>
          <div>
            <Text c="dimmed" size="sm">
              {place.source}
            </Text>
            <Text size="xs" mt={4}>
              {place.description}
            </Text>
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}

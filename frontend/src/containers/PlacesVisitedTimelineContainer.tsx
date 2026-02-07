import { TZDate } from "@date-fns/tz";
import { Text, Timeline } from "@mantine/core";
import { IconCloud, IconListCheck, IconLocation } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { type Duration, intervalToDuration } from "date-fns";
import { endOfDay } from "date-fns/endOfDay";
import { format } from "date-fns/format";
import { startOfDay } from "date-fns/startOfDay";
import { uniqueId } from "lodash";
import { trpc } from "../api/trpc";

type PlacesVisitedTimelineContainerProps = {
  date: Date;
  onFilterChange?: (endDate: Date) => void;
};

const formatDurationShort = (d: Duration) => {
  const parts = [];
  if (d.hours) parts.push(`${d.hours}h`);
  if (d.minutes) parts.push(`${d.minutes}m`);
  if (d.seconds) parts.push(`${d.seconds}s`);
  return parts.join(" ");
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
      {data.map((place) => {
        const start = new TZDate(place.startDate, place.timezone);
        const end = place.endDate ? new TZDate(place.endDate, place.timezone) : null;
        const duration = end ? intervalToDuration({ start, end }) : null;
        const getIcon = () => {
          switch (place.type) {
            case "location":
              return <IconLocation size={12} />;
            case "weather":
              return <IconCloud size={12} />;
            case "habit":
              return <IconListCheck size={12} />;
          }
        };

        return (
          <Timeline.Item key={uniqueId()} bullet={getIcon()} title={place.title}>
            <div>
              <Text c="dimmed" size="sm">
                {format(new TZDate(place.startDate, place.timezone), "HH:mm:ss")}
              </Text>
              {duration ? (
                <Text c="dimmed" size="sm">
                  For {formatDurationShort(duration)}
                </Text>
              ) : null}
              <Text size="xs" mt={4}>
                {place.description}
              </Text>
            </div>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}

import { Timeline } from "@mantine/core";
import { IconLocation } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDuration, intervalToDuration, parseISO } from "date-fns";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { uniqueId } from "lodash";
import { useEffect, useState } from "react";
import { trpc } from "../api/trpc";
import { VisitedPlaceTimelineItem } from "../components/VisitedPlaceTimelineItem/VisitedPlaceTimelineItem";

type PlacesVisitedTimelineContainerProps = {
  date: Date;
  onFilterChange?: (endDate: Date) => void;
};

export default function PlacesVisitedTimelineContainer(props: PlacesVisitedTimelineContainerProps) {
  const { data: locationData, isLoading } = useQuery(
    trpc.charts.locations.getTimeline.queryOptions({
      start: startOfDay(props.date).toISOString(),
      end: endOfDay(props.date).toISOString(),
    }),
  );
  const { data: habitData } = useQuery(
    trpc.habits.getByDay.queryOptions({
      day: format(props.date, "yyyy-MM-dd"),
      privateMode: false,
    }),
  );
  const [activeIndex, setActiveIndex] = useState<number>();

  useEffect(() => {
    if (locationData) {
      setActiveIndex(locationData.length - 1);
    }
  }, [locationData]);

  if (isLoading) {
    return "Loading...";
  }

  if (!locationData) {
    return null;
  }

  const hEvents =
    habitData?.map((h) => ({
      title: h.key,
      subtitle: `${h.source} at ${format(parseISO(h.recordedAt ?? ""), "HH:mm")}`,
      description: String(h.value),
      date: parseISO(h.recordedAt ?? ""),
    })) ?? [];

  const lEvents =
    locationData?.map((l) => ({
      title: l.placeOfInterest?.displayName ?? "Moving",
      subtitle: l.placeOfInterest?.source === "userPOIJson" ? "Place of interest" : "External",
      description: `${formatDuration(
        intervalToDuration({
          start: new Date(l.startDate ?? ""),
          end: new Date(l.endDate ?? ""),
        }),
      )} - ${format(parseISO(l.startDate ?? ""), "HH:mm")} to ${format(parseISO(l.endDate ?? ""), "HH:mm")}`,
      date: parseISO(l.startDate ?? ""),
    })) ?? [];

  const events = [...hEvents, ...lEvents].sort((a, b) => a.date - b.date);
  return (
    <Timeline active={activeIndex} bulletSize={24} lineWidth={2}>
      {events.map((place, i) => (
        <Timeline.Item key={uniqueId()} bullet={<IconLocation size={12} />} title={place.title}>
          <VisitedPlaceTimelineItem index={i} place={place} />
        </Timeline.Item>
      ))}
    </Timeline>
  );
}

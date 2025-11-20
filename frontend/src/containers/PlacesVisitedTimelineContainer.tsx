import { Timeline } from "@mantine/core";
import { IconLocation } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { useCallback, useEffect, useState } from "react";
import { trpc } from "../api/trpc";
import { VisitedPlaceTimelineItem } from "../components/VisitedPlaceTimelineItem/VisitedPlaceTimelineItem";

type PlacesVisitedTimelineContainerProps = {
  date: Date;
  onFilterChange?: (endDate: Date) => void;
};

export default function PlacesVisitedTimelineContainer(props: PlacesVisitedTimelineContainerProps) {
  const { data, isLoading } = useQuery(
    trpc.charts.locations.getVisitedPlaces.queryOptions({
      start: startOfDay(props.date).toISOString(),
      end: endOfDay(props.date).toISOString(),
    }),
  );
  const [activeIndex, setActiveIndex] = useState<number>();

  useEffect(() => {
    if (data) {
      setActiveIndex(data.length - 1);
    }
  }, [data]);

  const handleItemHover = useCallback(
    (index: number) => {
      setActiveIndex(index);
      const itemEndDate = data?.[index].endDate;
      if (itemEndDate) {
        props.onFilterChange?.(new Date(itemEndDate));
      }
    },
    [data, props.onFilterChange],
  );

  if (isLoading) {
    return "Loading...";
  }

  if (!data) {
    return null;
  }

  return (
    <Timeline active={activeIndex} bulletSize={24} lineWidth={2}>
      {data.map((place, i) => (
        <Timeline.Item
          key={`${place.startDate}-${place.endDate}`}
          bullet={<IconLocation size={12} />}
          title={place.placeOfInterest?.displayName ?? "Moving"}
        >
          <VisitedPlaceTimelineItem index={i} place={place} onHovered={handleItemHover} />
        </Timeline.Item>
      ))}
    </Timeline>
  );
}

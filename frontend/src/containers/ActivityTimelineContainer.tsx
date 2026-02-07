import { Timeline } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { uniqueId } from "lodash";
import { trpc } from "../api/trpc";
import { ActivityTimelineItem } from "../components/VisitedPlaceTimelineItem/ActivityTimelineItem";

type ActivityTimelineContainerProps = {
  date: Date;
};

export default function ActivityTimelineContainer(props: ActivityTimelineContainerProps) {
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
    <Timeline bulletSize={30} lineWidth={2}>
      {data.map((activity) => (
        <ActivityTimelineItem key={uniqueId()} activity={activity} />
      ))}
    </Timeline>
  );
}

import { Stack } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { uniqueId } from "lodash";
import { trpc } from "../api/trpc";
import { ActivityTimelineItem } from "../components/ActivityTimelineItem/ActivityTimelineItem";

type Props = {
  date: Date;
};

export default function ActivityTimelineContainer(props: Props) {
  const { date } = props;
  const { data, isLoading } = useQuery(
    trpc.timelineRouter.listActivities.queryOptions({
      start: startOfDay(date).toISOString(),
      end: endOfDay(date).toISOString(),
    }),
  );

  if (isLoading) return "Loading...";
  if (!data) return null;

  return (
    <Stack pos="relative" maw={500} gap="xl">
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 2,
          background: "var(--mantine-color-dark-5)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      {data.map((activity) => (
        <ActivityTimelineItem key={uniqueId()} activity={activity} />
      ))}
    </Stack>
  );
}

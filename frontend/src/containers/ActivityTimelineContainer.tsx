import { Group, Stack, Switch, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { uniqueId } from "lodash";
import { useState } from "react";
import { trpc } from "../api/trpc";
import { ActivityTimelineItem } from "../components/ActivityTimelineItem/ActivityTimelineItem";

type Props = {
  date: Date;
};

export default function ActivityTimelineContainer(props: Props) {
  const { date } = props;
  const [filters, setFilters] = useState<TimelineFilters>({
    habit: true,
    location: true,
    website: true,
  });
  const { data, isLoading } = useQuery(
    trpc.timelineRouter.listActivities.queryOptions({
      start: startOfDay(date).toISOString(),
      end: endOfDay(date).toISOString(),
      config: filters,
    }),
  );

  if (isLoading) return "Loading...";
  if (!data) return null;

  return (
    <Stack>
      <TimelineConfig value={filters} onChange={setFilters} />
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
    </Stack>
  );
}
type TimelineFilters = {
  habit: boolean;
  location: boolean;
  website: boolean;
};
function TimelineConfig({ value, onChange }: { value: TimelineFilters; onChange: (v: TimelineFilters) => void }) {
  return (
    <Group gap="lg">
      <Text size="sm" fw={500} c="dimmed">
        Show
      </Text>

      <Switch
        size="md"
        label="Habits"
        checked={value.habit}
        onChange={(e) => onChange({ ...value, habit: e.currentTarget.checked })}
      />

      <Switch
        size="md"
        label="Locations"
        checked={value.location}
        onChange={(e) => onChange({ ...value, location: e.currentTarget.checked })}
      />

      <Switch
        size="md"
        label="Websites"
        checked={value.website}
        onChange={(e) => onChange({ ...value, website: e.currentTarget.checked })}
      />
    </Group>
  );
}

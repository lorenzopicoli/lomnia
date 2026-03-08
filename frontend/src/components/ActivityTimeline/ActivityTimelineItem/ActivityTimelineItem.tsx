import { Card, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { RouterOutputs } from "../../../api/trpc";
import { useConfig } from "../../../contexts/ConfigContext";
import { ExerciseActivityTimelineItem } from "./ExerciseActivityTimelineItem";
import { HabitActivityTimelineItem } from "./HabitActivityTimelineItem";
import { LocationActivityTimelineItem } from "./LocationActivityTimelineItem";
import { SleepActivityTimelineItem } from "./SleepActivityTimelineItem";
import { WebsiteVisitActivityTimelineItem } from "./WebsiteVisitActivityTimelineItem";

type Item = RouterOutputs["timelineRouter"]["listActivities"]["activities"][number];
export function ActivityTimelineItem(props: { activity: Item }) {
  const { activity } = props;
  const { theme } = useConfig();

  const [opened, { toggle }] = useDisclosure(false);

  const handleToggle = () => {
    toggle();
  };
  return (
    <Card
      ml={{ base: 0, sm: "md" }}
      mr={{ base: 0, sm: "md" }}
      mt={{ base: "sm", sm: "md" }}
      mb={{ base: "sm", sm: "md" }}
      p={"md"}
      pos="relative"
      radius="lg"
      style={{
        background: theme.colors.gray[9],
      }}
    >
      {activity.type === "location" ? (
        <LocationActivityTimelineItem activity={activity} onExpand={handleToggle} isExpanded={opened} />
      ) : activity.type === "websiteVisit" ? (
        <WebsiteVisitActivityTimelineItem activity={activity} onExpand={handleToggle} isExpanded={opened} />
      ) : activity.type === "habit" ? (
        <HabitActivityTimelineItem activity={activity} onExpand={handleToggle} isExpanded={opened} />
      ) : activity.type === "sleep" ? (
        <SleepActivityTimelineItem activity={activity} onExpand={handleToggle} isExpanded={opened} />
      ) : activity.type === "exercise" ? (
        <ExerciseActivityTimelineItem activity={activity} onExpand={handleToggle} isExpanded={opened} />
      ) : (
        <Text size="sm">
          Couldn't find activity item. Maybe you forgot to add it to ActivityTimelineItem.tsx?{" "}
          {JSON.stringify(activity)}
        </Text>
      )}
    </Card>
  );
}

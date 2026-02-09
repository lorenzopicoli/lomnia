import { Card, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { RouterOutputs } from "../../../api/trpc";
import { cardDarkBackgroundNoTransparency } from "../../../themes/mantineThemes";
import { HabitActivityTimelineItem } from "./HabitActivityTimelineItem";
import { LocationActivityTimelineItem } from "./LocationActivityTimelineItem";
import { WebsiteVisitActivityTimelineItem } from "./WebsiteVisitActivityTimelineItem";

type Item = RouterOutputs["timelineRouter"]["listActivities"]["activities"][number];
export function ActivityTimelineItem(props: { activity: Item }) {
  const { activity } = props;
  const [opened, { toggle }] = useDisclosure(false);

  const handleToggle = () => {
    toggle();
  };
  return (
    <Card
      m="md"
      p="md"
      pos="relative"
      radius="lg"
      style={{
        background: cardDarkBackgroundNoTransparency,
      }}
    >
      {activity.type === "location" ? (
        <LocationActivityTimelineItem activity={activity} />
      ) : activity.type === "websiteVisit" ? (
        <WebsiteVisitActivityTimelineItem activity={activity} onExpand={handleToggle} isExpanded={opened} />
      ) : activity.type === "habit" ? (
        <HabitActivityTimelineItem activity={activity} />
      ) : (
        <Text size="sm">{JSON.stringify(activity)}</Text>
      )}
    </Card>
  );
}

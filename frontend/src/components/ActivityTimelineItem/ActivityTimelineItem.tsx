import { Card, Text } from "@mantine/core";
import type { RouterOutputs } from "../../api/trpc";
import { cardDarkBackgroundNoTransparency } from "../../themes/mantineThemes";
import { HabitActivityTimelineItem } from "./HabitActivityTimelineItem";
import { LocationActivityTimelineItem } from "./LocationActivityTimelineItem";
import { WebsiteVisitActivityTimelineItem } from "./WebsiteVisitActivityTimelineItem";

type Item = RouterOutputs["timelineRouter"]["listActivities"][number];

export function ActivityTimelineItem(props: { activity: Item }) {
  const { activity } = props;
  return (
    <Card
      p="md"
      pos="relative"
      bdrs="lg"
      style={{
        background: cardDarkBackgroundNoTransparency,
        zIndex: 1,
      }}
    >
      {activity.type === "location" ? (
        <LocationActivityTimelineItem activity={activity} />
      ) : activity.type === "websiteVisit" ? (
        <WebsiteVisitActivityTimelineItem activity={activity} />
      ) : activity.type === "habit" ? (
        <HabitActivityTimelineItem activity={activity} />
      ) : (
        <Text>{JSON.stringify(activity)}</Text>
      )}
    </Card>
  );
}

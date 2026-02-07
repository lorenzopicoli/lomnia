import { TZDate } from "@date-fns/tz";
import { Card, Stack, Text, Timeline } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconCloud, IconListCheck, IconLocation, IconWorld } from "@tabler/icons-react";
import { format, intervalToDuration } from "date-fns";
import { Link } from "react-router-dom";
import type { RouterOutputs } from "../../api/trpc";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { formatDurationShort } from "../../utils/formatDurationShort";

type Item = RouterOutputs["timelineRouter"]["listActivities"][number];
export function ActivityTimelineItem(props: { activity: Item; onHovered?: (index: number) => void }) {
  const { activity } = props;
  const { hovered, ref } = useHover();
  const start = new TZDate(activity.startDate, activity.timezone);
  const end = activity.endDate ? new TZDate(activity.endDate, activity.timezone) : null;
  const duration = end ? intervalToDuration({ start, end }) : null;
  const getIcon = () => {
    const size = 20;
    switch (activity.type) {
      case "location":
        return <IconLocation size={size} />;
      case "weather":
        return <IconCloud size={size} />;
      case "habit":
        return <IconListCheck size={size} />;
      case "websiteVisit":
        return <IconWorld size={size} />;
    }
  };

  return (
    <Timeline.Item ref={ref} bullet={getIcon()} title={""}>
      <Card p={"md"} bg={cardDarkBackground}>
        <Stack>
          <Text>{activity.title}</Text>
          <Text c="dimmed" size="sm">
            {format(new TZDate(activity.startDate, activity.timezone), "HH:mm:ss")}
          </Text>
          {duration ? (
            <Text c="dimmed" size="sm">
              For {formatDurationShort(duration)}
            </Text>
          ) : null}
          {activity.description?.startsWith("https://") ? (
            <Link to={activity.description}>
              <Text truncate="end" size="xs" mt={4}>
                {activity.description}
              </Text>
            </Link>
          ) : (
            <Text truncate="end" size="xs" mt={4}>
              {activity.description}
            </Text>
          )}
        </Stack>
      </Card>
    </Timeline.Item>
  );
}

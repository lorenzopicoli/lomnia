import { Anchor, Badge, Collapse, Group, Image, Stack, Text } from "@mantine/core";
import { IconDownload, IconExternalLink, IconWorld } from "@tabler/icons-react";
import { format } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "websiteVisit" }>;

export function WebsiteVisitActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { website, visit } = activity.data;

  const title = website.title ?? website.host ?? website.url;
  const time = format(new Date(visit.recordedAt), "HH:mm");

  return (
    <Stack gap="xs">
      <Group style={{ cursor: "pointer" }} gap="xs" wrap="nowrap" onClick={onExpand}>
        <IconWorld size={20} />

        <Text fw={500} truncate style={{ flex: 1 }}>
          {title}
        </Text>

        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
          {time}
        </Text>
      </Group>

      {website.host && (
        <Text size="xs" c="dimmed">
          {website.host}
        </Text>
      )}

      {activity.data.visit.fileDownloaded && (
        <Group gap={6} mt={4}>
          <IconDownload size={14} />
          <Text size="xs" c="dimmed">
            Downloaded
          </Text>
          <Badge size="xs" variant="light">
            {activity.data.visit.fileDownloaded}
          </Badge>
        </Group>
      )}

      <Collapse in={isExpanded}>
        {website.description && (
          <Text size="sm" lineClamp={3}>
            {website.description}
          </Text>
        )}

        {website.previewImageUrl && <Image src={website.previewImageUrl} radius="sm" h={130} fit="cover" />}
      </Collapse>

      <Group justify="space-between" align="center" mt="xs">
        <Group>
          <Badge variant="light" size="xs">
            Website visit
          </Badge>
          <Badge variant="light" size="xs">
            {activity.data.visit.source}
          </Badge>
        </Group>

        <Anchor href={website.url} target="_blank" size="xs" c="dimmed">
          Open <IconExternalLink size={12} />
        </Anchor>
      </Group>
    </Stack>
  );
}

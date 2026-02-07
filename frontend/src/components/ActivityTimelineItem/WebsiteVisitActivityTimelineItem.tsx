import { Anchor, Badge, Group, Image, Stack, Text } from "@mantine/core";
import { IconDownload, IconExternalLink, IconWorld } from "@tabler/icons-react";
import { format } from "date-fns";
import type { RouterOutputs } from "../../api/trpc";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"][number], { type: "websiteVisit" }>;

export function WebsiteVisitActivityTimelineItem(props: { activity: Item }) {
  const { activity } = props;
  const { website, visit } = activity.data;

  const title = website.title ?? website.host ?? website.url;
  const time = format(new Date(visit.recordedAt), "HH:mm");

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconWorld size={20} />
          <Text fw={500}>{title}</Text>
        </Group>

        <Text size="xs" c="dimmed">
          {time}
        </Text>
      </Group>

      {website.host && (
        <Text size="xs" c="dimmed">
          {website.host}
        </Text>
      )}

      {website.description && (
        <Text size="sm" lineClamp={3}>
          {website.description}
        </Text>
      )}

      {website.previewImageUrl && <Image src={website.previewImageUrl} radius="sm" h={140} fit="cover" />}
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

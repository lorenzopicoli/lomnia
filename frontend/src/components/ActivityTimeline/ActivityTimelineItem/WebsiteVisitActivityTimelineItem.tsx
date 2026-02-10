import { TZDate } from "@date-fns/tz";
import { Anchor, Badge, Collapse, Group, Image, Stack, Text } from "@mantine/core";
import { IconDownload, IconExternalLink } from "@tabler/icons-react";
import { format } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";
import { websiteVisitActivitySourceToIcon } from "./activitySourceToIcon";
import { websiteVisitTypeFormat } from "./websiteVistTypeFormat";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "websiteVisit" }>;

export function WebsiteVisitActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { website, visit } = activity.data;

  const title = website.title ?? website.host ?? website.url;
  const time = format(new TZDate(visit.recordedAt, visit.timezone ?? ""), "HH:mm");

  return (
    <Stack gap="xs">
      <Group style={{ cursor: "pointer" }} align="center" gap="xs" wrap="nowrap" onClick={onExpand}>
        {websiteVisitActivitySourceToIcon(visit.source)}

        <Text
          fw={500}
          style={{
            flex: 1,
            minWidth: 0,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {title}
        </Text>

        <Text
          size="xs"
          c="dimmed"
          style={{
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {time}
        </Text>
      </Group>

      {website.url && (
        <Text size="xs" c="dimmed" truncate={isExpanded ? undefined : "end"}>
          {website.url}
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
        <Group gap="xs">
          <Badge variant="light" size="xs">
            Website visit
          </Badge>
          <Badge variant="light" size="xs">
            {activity.data.visit.source}
          </Badge>
          {visit.type ? (
            <Badge variant="light" size="xs">
              {websiteVisitTypeFormat(visit.type)}
            </Badge>
          ) : null}
        </Group>

        <Anchor href={website.url} target="_blank" size="xs" c="dimmed">
          Open <IconExternalLink size={12} />
        </Anchor>
      </Group>
    </Stack>
  );
}

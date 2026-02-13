import { TZDate } from "@date-fns/tz";
import { Anchor, Badge, Collapse, Group, Stack, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { format } from "date-fns";
import type { RouterOutputs } from "../../../api/trpc";

type Item = RouterOutputs["timelineRouter"]["listActivities"]["activities"][number];

type Props = {
  activity: Item;
  title: string;
  timezone: string;
  isExpanded: boolean;
  overwriteTime?: string;
  tags?: (string | null | undefined)[];
  externalLink?: string;
  renderExpanded?: () => React.ReactNode;
  renderCollapsed?: () => React.ReactNode;
  renderIcon: () => React.ReactNode;
  onExpand?: () => void;
};

export function BaseActivityTimelineItem(props: Props) {
  const {
    activity,
    title,
    timezone,
    overwriteTime,
    tags = [],
    externalLink,
    renderCollapsed,
    renderExpanded,
    renderIcon,
    onExpand,
    isExpanded,
  } = props;

  const time = overwriteTime ?? format(new TZDate(activity.date, timezone ?? ""), "HH:mm");

  return (
    <Stack gap="xs">
      <Group
        style={{ cursor: renderExpanded ? "pointer" : undefined }}
        align="center"
        gap="xs"
        wrap="nowrap"
        onClick={renderExpanded ? onExpand : undefined}
      >
        {renderIcon()}

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

      {renderCollapsed?.()}

      <Collapse in={isExpanded}>{renderExpanded?.()}</Collapse>

      <Group justify="space-between" align="center" mt="xs">
        <Group gap="xs">
          {tags
            .filter((t) => !!t)
            .map((tag) => (
              <Badge key={tag} variant="light" size="xs">
                {tag}
              </Badge>
            ))}
        </Group>

        {externalLink ? (
          <Anchor href={externalLink} target="_blank" size="xs" c="dimmed">
            Open <IconExternalLink size={12} />
          </Anchor>
        ) : null}
      </Group>
    </Stack>
  );
}

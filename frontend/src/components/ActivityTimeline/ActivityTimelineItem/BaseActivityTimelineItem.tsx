import { TZDate } from "@date-fns/tz";
import { Anchor, Badge, Collapse, Container, Divider, Group, Stack, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { addSeconds, format, formatISO, subSeconds } from "date-fns";
import { type RouterOutputs, trpc } from "../../../api/trpc";
import { MaximizableMap } from "../../MaximizableMap";

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

  const { data: locationData, isPending: isLoadingLocationData } = useQuery(
    trpc.charts.locations.getForPeriod.queryOptions(
      {
        start: formatISO(subSeconds(new TZDate(activity.date, "UTC"), 60)),
        end: formatISO(addSeconds(new TZDate(activity.date, "UTC"), 60)),
      },
      { enabled: isExpanded },
    ),
  );

  const time = overwriteTime ?? format(new TZDate(activity.date, timezone ?? ""), "HH:mm");

  return (
    <Stack gap="xs">
      <Group style={{ cursor: "pointer" }} align="center" gap="xs" wrap="nowrap" onClick={onExpand}>
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

      <Collapse in={isExpanded}>
        <Stack>
          <Divider />
          {renderExpanded?.()}
          <Container style={{ overflow: "clip" }} bdrs={"lg"} w={"100%"} h={300} fluid p={0}>
            <MaximizableMap points={locationData ?? []} isLoading={isLoadingLocationData} />
          </Container>
        </Stack>
      </Collapse>

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

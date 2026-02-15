import { Image, Text } from "@mantine/core";
import type { RouterOutputs } from "../../../api/trpc";
import { websiteVisitActivitySourceToIcon } from "./activitySourceToIcon";
import { BaseActivityTimelineItem } from "./BaseActivityTimelineItem";
import { websiteVisitTypeFormat } from "./websiteVistTypeFormat";

type Item = Extract<RouterOutputs["timelineRouter"]["listActivities"]["activities"][number], { type: "websiteVisit" }>;

export function WebsiteVisitActivityTimelineItem(props: { activity: Item; onExpand: () => void; isExpanded: boolean }) {
  const { activity, onExpand, isExpanded } = props;
  const { website, visit } = activity.data;

  const title = website.title ?? website.host ?? website.url;

  return (
    <BaseActivityTimelineItem
      activity={activity}
      title={title}
      timezone={visit.timezone}
      tags={["Website visit", activity.data.visit.source, visit.type && websiteVisitTypeFormat(visit.type)]}
      externalLink={website.url}
      renderCollapsed={() => (
        <>
          {website.url && (
            <Text size="xs" c="dimmed" truncate={isExpanded ? undefined : "end"}>
              {website.url}
            </Text>
          )}
        </>
      )}
      renderExpanded={() => (
        <>
          {website.description && (
            <Text size="sm" lineClamp={3}>
              {website.description}
            </Text>
          )}

          {website.previewImageUrl && <Image src={website.previewImageUrl} radius="sm" h={130} fit="cover" />}
        </>
      )}
      renderIcon={() => websiteVisitActivitySourceToIcon(visit.source)}
      onExpand={onExpand}
      isExpanded={isExpanded}
    />
  );
}

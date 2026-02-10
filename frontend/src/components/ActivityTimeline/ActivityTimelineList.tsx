import { Skeleton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { RouterOutputs } from "../../api/trpc";
import { ActivityTimelineItem } from "./ActivityTimelineItem/ActivityTimelineItem";

export type TimelineFilters = {
  habit: boolean;
  location: boolean;
  website: boolean;
};
type Props = { isLoading: boolean; activities?: RouterOutputs["timelineRouter"]["listActivities"]["activities"] };

export function ActivityTimelineList(props: Props) {
  const { activities, isLoading } = props;
  const parentRef = useRef(null);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const rowVirtualizer = useVirtualizer({
    count: isLoading || !activities ? 100 : activities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const items = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        flex: 1,
        height: "100%",
        overflow: "auto",
        minWidth: isSmallScreen ? 300 : 450,
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "var(--mantine-spacing-md)",
            bottom: "var(--mantine-spacing-md)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 2,
            background: "var(--mantine-color-violet-5)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <div
              style={{
                maxWidth: "500px",
                marginInline: "auto",
              }}
            >
              {!activities || isLoading ? (
                <Skeleton w={400} h={120} m="md" bdrs={"lg"} />
              ) : (
                <ActivityTimelineItem activity={activities[virtualItem.index]} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { RouterOutputs } from "../../api/trpc";
import { safeScrollableArea } from "../../constants";
import { ActivityTimelineItem } from "./ActivityTimelineItem/ActivityTimelineItem";

export type TimelineFilters = {
  habit: boolean;
  location: boolean;
  website: boolean;
};
type Props = { activities: RouterOutputs["timelineRouter"]["listActivities"]["activities"] };

export function ActivityTimelineList(props: Props) {
  const { activities } = props;
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: activities.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: safeScrollableArea,
        overflow: "auto",
      }}
    >
      {/* The large inner element to hold all of the items */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
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
            background: "var(--mantine-color-dark-5)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        {/* Only the visible items in the virtualizer, manually positioned to be in view */}
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ActivityTimelineItem activity={activities[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useHover } from "@mantine/hooks";
import type { RouterOutputs } from "../../api/trpc";
import { useEffect } from "react";
import { formatDuration } from "date-fns/formatDuration";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { Text } from "@mantine/core";

export function VisitedPlaceTimelineItem(props: {
  place: RouterOutputs["getVisitedPlaces"][number];
  onHovered?: (index: number) => void;
  index: number;
}) {
  const { place } = props;
  const { hovered, ref } = useHover();

  useEffect(() => {
    if (hovered) {
      props.onHovered?.(props.index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, props.onHovered]);

  return (
    <div ref={ref}>
      <Text c="dimmed" size="sm">
        {place.placeOfInterest?.source === "userPOIJson" ? "Place of interest" : "External"}
      </Text>
      <Text size="xs" mt={4}>
        {formatDuration(
          intervalToDuration({
            start: new Date(place.startDate ?? ""),
            end: new Date(place.endDate ?? ""),
          }),
        )}
      </Text>
      {place.mode ? (
        <Text size="xs" mt={4}>
          {place.mode} ({place.velocity.toFixed(2)}km/h)
        </Text>
      ) : null}
    </div>
  );
}

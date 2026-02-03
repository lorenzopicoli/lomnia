import { Text } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { useEffect } from "react";

export function VisitedPlaceTimelineItem(props: {
  place: {
    title: string;
    subtitle: string;
    description: string;
    date: Date;
  };
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
        {place.subtitle}
      </Text>
      <Text size="xs" mt={4}>
        {place.description}
      </Text>
    </div>
  );
}

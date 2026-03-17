import { Flex, Group, Skeleton, Stack } from "@mantine/core";
import { IconBed, IconMoon } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { startOfDay } from "date-fns/startOfDay";
import { trpc } from "../api/trpc";
import { WeatherInfoItem, type WeatherInfoItemProps } from "../components/WeatherInfoItem/WeatherInfoItem";
import { formatDurationShort } from "../utils/formatDurationShort";

type DailySleepOverviewContainerProps = {
  date: Date;
};

export default function DailySleepOverviewContainer(props: DailySleepOverviewContainerProps) {
  const { data, isLoading } = useQuery(
    trpc.sleep.getByDay.queryOptions({
      day: format(startOfDay(props.date), "yyyy-MM-dd"),
    }),
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!data || !data.length) {
    return null;
  }

  const sleep = data[0].sleep;

  const start = new Date(sleep.startedAt);
  const end = new Date(sleep.endedAt);

  const duration = intervalToDuration({
    start,
    end,
  });

  const score = sleep.userScore ?? sleep.automaticScore;

  const items: WeatherInfoItemProps[] = [
    score != null && {
      icon: IconMoon,
      color: "#7c5cff",
      label: `Sleep Score: ${score}`,
    },
    {
      icon: IconBed,
      color: "#82c91e",
      label: `${format(start, "HH:mm")} → ${format(end, "HH:mm")} (${formatDurationShort(duration)})`,
    },
  ].filter(Boolean) as WeatherInfoItemProps[];

  return (
    <Stack w="100%" gap="md">
      {/* --- Top stats --- */}
      <Group style={{ flexWrap: "wrap" }} maw={"100%"} miw={0} w="100%">
        {items.map((item) => (
          <WeatherInfoItem key={item.label} {...item} />
        ))}
      </Group>
    </Stack>
  );
}

function Loading() {
  return (
    <Group style={{ flexWrap: "wrap" }} maw={"100%"} miw={0} w="100%">
      {Array.from({ length: 5 }).map(() => (
        // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
        <Flex gap="sm">
          <Skeleton h={30} w={30} bdrs={20} />
          <Skeleton h={30} w={100} />
        </Flex>
      ))}
    </Group>
  );
}

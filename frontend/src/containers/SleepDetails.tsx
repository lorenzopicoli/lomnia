import { TZDate } from "@date-fns/tz";
import { Container, Flex, ScrollArea, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { intervalToDuration } from "date-fns";
import { trpc } from "../api/trpc";
import { NonRegisteredChartDisplayer } from "../components/ChartDisplayer/ChartDisplayer";
import { MaximizableMap } from "../components/MaximizableMap";
import { StatCard } from "../components/StatCard/StartCard";
import { smallContentMaxWidth } from "../constants";
import { formatDate } from "../utils/formatDate";
import { formatDateLong } from "../utils/formatDateLong";
import { formatDurationShort } from "../utils/formatDurationShort";
import { isNumber } from "../utils/isNumber";
import { HeartRateLine } from "./Charts/HeartRateLine";

export function SleepDetails(props: { id: number }) {
  const { data: sleepData } = useQuery(
    trpc.sleep.getById.queryOptions({
      id: props.id,
    }),
  );

  const { data: locationData, isFetching: isLoadingMap } = useQuery(
    trpc.location.getForPeriod.queryOptions(
      {
        start: sleepData ? sleepData.sleep.startedAt : "",
        end: sleepData ? sleepData.sleep.endedAt : "",
      },
      { enabled: !!sleepData },
    ),
  );

  const { data: heartData } = useQuery(
    trpc.heartRate.getForPeriod.queryOptions(
      {
        start: sleepData ? sleepData.sleep.startedAt : "",
        end: sleepData ? sleepData.sleep.endedAt : "",
      },
      { enabled: !!sleepData },
    ),
  );

  if (!sleepData) {
    return <Loading />;
  }

  const { sleep, stages } = sleepData;

  const start = new TZDate(sleep.startedAt, sleep.timezone || "UTC");
  const end = new TZDate(sleep.endedAt, sleep.timezone || "UTC");

  const duration = intervalToDuration({
    start,
    end,
  });

  return (
    <Flex direction="column" h="100%" mb="sm" mih={0}>
      <ScrollArea flex={1} p="md" type="never">
        <Stack gap={"xl"} maw={smallContentMaxWidth} ml={"auto"} mr={"auto"}>
          <Stack gap={2}>
            <Title order={2}>{formatDateLong(sleep.endedAt, sleep.timezone ?? "UTC", false)}</Title>
            <Text c="dimmed">
              {`${formatDate(sleep.startedAt, sleep.timezone ?? "UTC")} - ${formatDate(sleep.endedAt, sleep.timezone ?? "UTC")}`}
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
            <StatCard label="Duration" value={formatDurationShort(duration, { skipSeconds: false })} />
            {isNumber(sleep.automaticScore) ? <StatCard label="Automatic score" value={sleep.automaticScore} /> : null}
            {isNumber(sleep.userScore) ? <StatCard label="User score" value={sleep.userScore} /> : null}
            <StatCard label="Device" value={sleep.externalDeviceId} />
          </SimpleGrid>

          {isLoadingMap || (locationData?.length ?? 0) > 0 ? (
            <Container style={{ overflow: "clip" }} bdrs="lg" w="100%" maw={1000} h={400} fluid p={0}>
              <MaximizableMap isInteractive={false} points={locationData ?? []} isLoading={isLoadingMap} />
            </Container>
          ) : null}

          {heartData ? (
            <Container w="100%" h={400} fluid p={0}>
              <NonRegisteredChartDisplayer title="Heart rate">
                <HeartRateLine data={heartData} startTime={start} />
              </NonRegisteredChartDisplayer>
            </Container>
          ) : null}
        </Stack>
      </ScrollArea>
    </Flex>
  );
}

function Loading() {
  return <Skeleton />;
}

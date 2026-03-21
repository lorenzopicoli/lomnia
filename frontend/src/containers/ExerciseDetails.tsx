import { TZDate } from "@date-fns/tz";
import { Container, Flex, Group, Paper, ScrollArea, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { intervalToDuration } from "date-fns";
import { trpc } from "../api/trpc";
import { MaximizableMap } from "../components/MaximizableMap";
import { formatCadence } from "../utils/formatCadence";
import { formatDistance } from "../utils/formatDistance";
import { formatDurationShort } from "../utils/formatDurationShort";
import { formatExerciseType } from "../utils/formatExerciseType";
import { formatHeartRate } from "../utils/formatHeartRate";
import { formatPace } from "../utils/formatPace";

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="lg" fw={600}>
          {value ?? "-"}
        </Text>
      </Stack>
    </Paper>
  );
}

export function ExerciseDetails(props: { id: number }) {
  const { data: exerciseData } = useQuery(
    trpc.exercise.getById.queryOptions({
      id: props.id,
      includeAdvancedDetails: true,
    }),
  );

  const { data: locationData, isFetching: isLoadingMap } = useQuery(
    trpc.location.getForPeriod.queryOptions(
      {
        start: exerciseData ? exerciseData.exercise.startedAt : "",
        end: exerciseData ? exerciseData.exercise.endedAt : "",
      },
      { enabled: !!exerciseData },
    ),
  );

  if (!exerciseData) {
    return <Loading />;
  }

  const { exercise, laps } = exerciseData;

  const start = new TZDate(exercise.startedAt, exercise.timezone || "UTC");
  const end = new TZDate(exercise.endedAt, exercise.timezone || "UTC");

  const duration = intervalToDuration({
    start,
    end,
  });

  return (
    <Flex direction="column" h="100%" mb="sm" mih={0}>
      <ScrollArea flex={1} p="md" type="never">
        <Stack>
          <Title order={2}>{exercise.name}</Title>

          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
            {exercise.distance ? <StatCard label="Distance" value={formatDistance(exercise.distance)} /> : null}
            <StatCard label="Duration" value={formatDurationShort(duration, { skipSeconds: false })} />
            <StatCard label="Avg Pace" value={formatPace(exercise.avgPace)} />
            <StatCard label="Avg HR" value={exercise.avgHeartRate ? formatHeartRate(exercise.avgHeartRate) : "-"} />
            <StatCard label="Cadence" value={exercise.avgCadence ? formatCadence(exercise.avgCadence) : "-"} />
            <StatCard label="Type" value={formatExerciseType(exercise.exerciseType)} />
          </SimpleGrid>

          <Container style={{ overflow: "clip" }} bdrs="lg" w="100%" h={400} fluid p={0}>
            {isLoadingMap || (locationData?.length ?? 0) > 0 ? (
              <MaximizableMap points={locationData ?? []} isLoading={isLoadingMap} />
            ) : null}
          </Container>

          {laps && laps.length > 0 && (
            <Stack gap="xs">
              <Text fw={600}>Laps</Text>
              <Stack gap={4}>
                {laps.map((lap) => (
                  <Group key={lap.id} justify="space-between">
                    {lap.distance ? <Text size="sm">{formatDistance(lap.distance)}</Text> : null}
                    <Text size="sm" c="dimmed">
                      {formatPace(lap.avgPace)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </ScrollArea>
    </Flex>
  );
}

function Loading() {
  return <Skeleton />;
}

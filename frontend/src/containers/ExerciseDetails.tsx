import { TZDate } from "@date-fns/tz";
import { Container, Flex, ScrollArea, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { intervalToDuration } from "date-fns";
import { isNumber } from "lodash";
import { trpc } from "../api/trpc";
import { NonRegisteredChartDisplayer } from "../components/ChartDisplayer/ChartDisplayer";
import { ExerciseLapsTable } from "../components/Exercise/ExerciseLapsTable";
import { List } from "../components/List/List";
import { MaximizableMap } from "../components/MaximizableMap";
import { RawHabitRow } from "../components/Rows/RawHabitRow";
import { StatCard } from "../components/StatCard/StartCard";
import { smallContentMaxWidth } from "../constants";
import { formatCadence } from "../utils/formatCadence";
import { formatDate } from "../utils/formatDate";
import { formatDistance } from "../utils/formatDistance";
import { formatDurationShort } from "../utils/formatDurationShort";
import { formatExerciseType } from "../utils/formatExerciseType";
import { formatHeartRate } from "../utils/formatHeartRate";
import { formatPace } from "../utils/formatPace";
import { ExerciseMetricsLine } from "./Charts/ExerciseMetricsLine";
import { HeartRateLine } from "./Charts/HeartRateLine";

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

  const { data: heartData } = useQuery(
    trpc.heartRate.getForPeriod.queryOptions(
      {
        start: exerciseData ? exerciseData.exercise.startedAt : "",
        end: exerciseData ? exerciseData.exercise.endedAt : "",
      },
      { enabled: !!exerciseData },
    ),
  );

  const { data: habitsData } = useQuery(
    trpc.habits.getForPeriod.queryOptions(
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

  const { exercise, laps, metrics } = exerciseData;

  const start = new TZDate(exercise.startedAt, exercise.timezone || "UTC");
  const end = new TZDate(exercise.endedAt, exercise.timezone || "UTC");

  const duration = intervalToDuration({
    start,
    end,
  });

  return (
    <Flex direction="column" h="100%" mb="sm" mih={0}>
      <ScrollArea flex={1} p="md" type="never">
        <Stack gap={"xl"} maw={smallContentMaxWidth} ml={"auto"} mr={"auto"}>
          <Stack gap={2}>
            <Title order={2}>{exercise.name}</Title>
            <Text c="dimmed">
              {`${formatDate(exercise.startedAt, exercise.timezone ?? "UTC")} - ${formatDate(exercise.endedAt, exercise.timezone ?? "UTC")}`}
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
            {exercise.distance ? <StatCard label="Distance" value={formatDistance(exercise.distance)} /> : null}
            <StatCard label="Duration" value={formatDurationShort(duration, { skipSeconds: false })} />
            {isNumber(exercise.perceivedEffort) ? (
              <StatCard
                label="Perceived Effort"
                value={exercise.perceivedEffort ? `${exercise.perceivedEffort}/100` : "-"}
              />
            ) : null}
            {isNumber(exercise.feelScore) ? (
              <StatCard label="Feel" value={exercise.feelScore ? `${exercise.feelScore}/100` : "-"} />
            ) : null}
            {exercise.avgPace ? <StatCard label="Avg Pace" value={formatPace(exercise.avgPace)} /> : null}
            <StatCard label="Avg HR" value={exercise.avgHeartRate ? formatHeartRate(exercise.avgHeartRate) : "-"} />
            {exercise.avgCadence ? (
              <StatCard label="Cadence" value={exercise.avgCadence ? formatCadence(exercise.avgCadence) : "-"} />
            ) : null}
            <StatCard label="Type" value={formatExerciseType(exercise.exerciseType)} />
            <StatCard label="Device" value={exercise.externalDeviceId} />
          </SimpleGrid>

          {isLoadingMap || (locationData?.length ?? 0) > 0 ? (
            <Container style={{ overflow: "clip" }} bdrs="lg" w="100%" maw={1000} h={400} fluid p={0}>
              <MaximizableMap isInteractive={false} points={locationData ?? []} isLoading={isLoadingMap} />
            </Container>
          ) : null}

          {laps && laps.length > 0 ? <ExerciseLapsTable laps={laps} /> : null}
          {heartData ? (
            <Container w="100%" h={400} fluid p={0}>
              <NonRegisteredChartDisplayer title="Heart rate">
                <HeartRateLine data={heartData} startTime={start} />
              </NonRegisteredChartDisplayer>
            </Container>
          ) : null}
          {metrics && metrics.length > 0 ? (
            <>
              <Container w="100%" h={400} fluid p={0}>
                <NonRegisteredChartDisplayer title="Pace">
                  <ExerciseMetricsLine
                    // Filter out weird pace entries. Might be a better way to do this? Maybe at least on the BE?
                    metrics={metrics.map((m) => ((m.pace ?? 0) > 9 ? { ...m, pace: null } : m))}
                    exerciseStartTime={start}
                    metric={{
                      key: "pace",
                      format: (v) => formatPace(v) ?? "-",
                    }}
                  />
                </NonRegisteredChartDisplayer>
              </Container>
              <Container w="100%" h={400} fluid p={0}>
                <NonRegisteredChartDisplayer title="Cadence">
                  <ExerciseMetricsLine
                    metrics={metrics}
                    exerciseStartTime={start}
                    metric={{
                      key: "cadence",
                      format: (v) => formatCadence(v) ?? "-",
                    }}
                  />
                </NonRegisteredChartDisplayer>
              </Container>{" "}
            </>
          ) : null}
          {habitsData && habitsData.length > 0 ? (
            <Container p={0} maw={"100%"} w={"100%"}>
              <Title order={4}>Habits</Title>
              <List
                data={habitsData}
                renderRow={(row) => <RawHabitRow {...row} habitKey={row.key} />}
                loadingRow={<Skeleton />}
              />
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

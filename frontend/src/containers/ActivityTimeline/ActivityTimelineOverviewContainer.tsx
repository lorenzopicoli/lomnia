import { AspectRatio, Card, Container, Stack } from "@mantine/core";
import { endOfDay, startOfDay } from "date-fns";
import { cardDarkBackground } from "../../themes/mantineThemes";
import DailyWeatherOverviewContainer from "../DailyWeatherOverviewContainer";
import HeatmapContainer from "../HeatmapContainer";

export default function ActivityTimelineOverviewContainer(props: { day: Date }) {
  const urlFormat = "yyyy-MM-dd";
  const { day } = props;
  // const { data, isPending } = useQuery(
  //   trpc.timelineRouter.listActivities.queryOptions({
  // day: format(day, urlDayFormat),
  //   }),
  // );

  return (
    <Container flex={0} fluid p={0}>
      <Card
        p="md"
        radius="lg"
        style={{
          background: cardDarkBackground,
        }}
      >
        <Stack>
          <DailyWeatherOverviewContainer date={day} />
          <Container p={0} w={500} h={500}>
            <AspectRatio
              style={{
                borderRadius: 10,
                overflow: "clip",
              }}
            >
              <HeatmapContainer startDate={startOfDay(day)} endDate={endOfDay(day)} />
            </AspectRatio>
          </Container>
        </Stack>
      </Card>
    </Container>
  );
}

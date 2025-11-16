import { Container, Flex, Paper, ScrollArea, useMantineTheme } from "@mantine/core";
import { Allotment } from "allotment";
import { endOfDay } from "date-fns/endOfDay";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { useSearchParams } from "react-router-dom";
import DailyHabitEntries from "../../containers/DailyHabitEntries";
import DailyWeatherOverviewContainer from "../../containers/DailyWeatherOverviewContainer";
import { DiaryEntryContainer } from "../../containers/DiaryEntryContainer";
import HeatmapContainer from "../../containers/HeatmapContainer";
import classes from "./Home.module.css";
import PlacesVisitedTimelineContainer from "../../containers/PlacesVisitedTimelineContainer";
import { useCallback, useEffect, useMemo, useState } from "react";

function Home() {
  const [searchParams] = useSearchParams();
  const daySearchParam = searchParams.get("day");
  const urlDayFormat = "yyyy-MM-dd";
  const parsedDay = useMemo(
    () => (daySearchParam ? parse(daySearchParam, urlDayFormat, new Date()) : new Date()),
    [daySearchParam],
  );
  const day = daySearchParam ? startOfDay(parsedDay) : startOfDay(new Date());
  const [mapFilter, setMapFilter] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: startOfDay(parsedDay),
    endDate: endOfDay(parsedDay),
  });

  const handleMapFilterChange = useCallback((endDate: Date) => {
    setMapFilter((prev) => ({ ...prev, endDate }));
  }, []);

  useEffect(() => {
    if (parsedDay) {
      setMapFilter({
        startDate: startOfDay(parsedDay),
        endDate: endOfDay(parsedDay),
      });
    }
  }, [parsedDay]);

  const theme = useMantineTheme();
  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <Allotment className={classes.splitPane}>
        <Allotment.Pane preferredSize={"75%"}>
          <ScrollArea
            h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
            type="never"
          >
            <Container className={classes.diaryEntry} pt={"md"} pb={"md"}>
              <DiaryEntryContainer date={day} />
              <Flex direction={"row"} pt={100}>
                <Container pb={"xl"} pl={0} fluid maw={"50%"}>
                  <PlacesVisitedTimelineContainer date={day} onFilterChange={handleMapFilterChange} />
                </Container>

                <Container fluid h={500} flex={"1"}>
                  {/* <AspectRatio ratio={1} className={classes.map}> */}
                  <HeatmapContainer startDate={mapFilter.startDate} endDate={mapFilter.endDate} />
                  {/* </AspectRatio> */}
                </Container>
              </Flex>
            </Container>
          </ScrollArea>
        </Allotment.Pane>
        <Allotment.Pane preferredSize={"25%"}>
          <ScrollArea
            h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
            type="never"
          >
            <Container fluid pt={"md"} pr={0}>
              {/* <Container pb={'xl'} pl={0} pt={'xl'} fluid>
                <PlacesVisitedTimelineContainer date={day} />
              </Container>
              <AspectRatio ratio={1} className={classes.map}>
                <HeatmapContainer
                  startDate={startOfDay(day)}
                  endDate={endOfDay(day)}
                />
              </AspectRatio>
              <Divider my="md" /> */}
              <DailyHabitEntries date={day} />
              <Container pl={0} pt={"xl"} fluid>
                <DailyWeatherOverviewContainer date={day} />
              </Container>
            </Container>
          </ScrollArea>
        </Allotment.Pane>
      </Allotment>
    </Paper>
  );
}

export default Home;

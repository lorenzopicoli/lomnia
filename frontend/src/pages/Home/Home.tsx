import { AspectRatio, Container, Flex, Paper, ScrollArea } from "@mantine/core";
import { Allotment } from "allotment";
import { endOfDay } from "date-fns/endOfDay";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { safeScrollableArea } from "../../constants";
import DailyHabitEntries from "../../containers/DailyHabitEntries";
import DailyWeatherOverviewContainer from "../../containers/DailyWeatherOverviewContainer";
import { DiaryEntryContainer } from "../../containers/DiaryEntryContainer";
import HeatmapContainer from "../../containers/HeatmapContainer";
import PlacesVisitedTimelineContainer from "../../containers/PlacesVisitedTimelineContainer";
import { useConfig } from "../../contexts/ConfigContext";
import classes from "./Home.module.css";

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

  const { theme } = useConfig();
  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <Allotment className={classes.splitPane}>
        <Allotment.Pane preferredSize={"75%"}>
          <ScrollArea h={safeScrollableArea} type="never">
            <Flex
              direction={"column"}
              component={Container}
              fluid
              className={classes.diaryEntry}
              pt={"xl"}
              pb={"md"}
              gap={100}
            >
              <DiaryEntryContainer date={day} />
              <Flex flex={1} direction={"row"}>
                <Container pb={"xl"} pl={0} fluid maw={400}>
                  <PlacesVisitedTimelineContainer date={day} onFilterChange={handleMapFilterChange} />
                </Container>

                <Container fluid h={500} flex={"1"}>
                  <AspectRatio ratio={1} mah={"75vh"} className={classes.map}>
                    <HeatmapContainer startDate={mapFilter.startDate} endDate={mapFilter.endDate} />
                  </AspectRatio>
                </Container>
              </Flex>
            </Flex>
          </ScrollArea>
        </Allotment.Pane>
        <Allotment.Pane preferredSize={"25%"}>
          <ScrollArea h={safeScrollableArea} type="never">
            <Flex component={Container} fluid pt={"xl"} pr={0}>
              <DailyHabitEntries date={day} />
              <Container pl={0} fluid>
                <DailyWeatherOverviewContainer date={day} />
              </Container>
            </Flex>
          </ScrollArea>
        </Allotment.Pane>
      </Allotment>
    </Paper>
  );
}

export default Home;

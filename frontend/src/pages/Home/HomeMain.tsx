import { ActionIcon, AspectRatio, Button, Container, Flex, Menu, ScrollArea, Space, Text, Title } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { format } from "date-fns";
import { endOfDay } from "date-fns/endOfDay";
import { startOfDay } from "date-fns/startOfDay";
import { useCallback, useEffect, useState } from "react";
import { safeScrollableArea } from "../../constants";
import { DiaryEntryContainer } from "../../containers/DiaryEntryContainer";
import HeatmapContainer from "../../containers/HeatmapContainer";
import PlacesVisitedTimelineContainer from "../../containers/PlacesVisitedTimelineContainer";
import classes from "./Home.module.css";

interface HomeMainProps {
  day: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onSetDay: (day: Date) => void;
}

export default function HomeMain(props: HomeMainProps) {
  const { day, onNextDay, onPreviousDay, onSetDay } = props;
  const formattedDate = format(day, "MMMM do, yyyy");
  const [mapFilter, setMapFilter] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: startOfDay(day),
    endDate: endOfDay(day),
  });

  const handlePickerChange = (value: string | undefined) => {
    onSetDay(value ? new Date(value) : new Date());
  };

  const handleMapFilterChange = useCallback((endDate: Date) => {
    setMapFilter((prev) => ({ ...prev, endDate }));
  }, []);

  useEffect(() => {
    if (day) {
      setMapFilter({
        startDate: startOfDay(day),
        endDate: endOfDay(day),
      });
    }
  }, [day]);
  return (
    <ScrollArea h={safeScrollableArea} type="never">
      <Flex
        direction={"column"}
        component={Container}
        fluid
        ta={"left"}
        style={{ verticalAlign: "top" }}
        pt={"lg"}
        pb={"md"}
        gap={60}
      >
        <Flex direction="column" w={"100%"}>
          <Text fs={"italic"} opacity={0.4}>
            Lomnia
          </Text>
          <Menu shadow="md" width={200}>
            <Flex w={"100%"}>
              <Menu.Target>
                <Button component={Title} fw={400} order={2} c={"unset"} p={0} variant="transparent">
                  {formattedDate}
                </Button>
              </Menu.Target>
              <Menu.Dropdown w={270}>
                <DatePicker type="default" value={day} onChange={handlePickerChange} />
              </Menu.Dropdown>
              <Space w={"xl"} />
              <ActionIcon variant="transparent" onClick={onPreviousDay}>
                <IconChevronLeft />
              </ActionIcon>
              <Space w={"lg"} />
              <ActionIcon variant="transparent" onClick={onNextDay}>
                <IconChevronRight />
              </ActionIcon>
            </Flex>
          </Menu>
        </Flex>
        <Container w="100%" p={0}>
          <DiaryEntryContainer date={day} />
        </Container>
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
  );
}

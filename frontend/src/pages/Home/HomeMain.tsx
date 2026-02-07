import { ActionIcon, Button, Container, Flex, Menu, ScrollArea, Space, Text, Title } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { format } from "date-fns";
import { endOfDay } from "date-fns/endOfDay";
import { isToday } from "date-fns/isToday";
import { startOfDay } from "date-fns/startOfDay";
import { useCallback, useEffect, useState } from "react";
import { safeScrollableArea } from "../../constants";
import PlacesVisitedTimelineContainer from "../../containers/PlacesVisitedTimelineContainer";

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

  const handlePickerChange = (value: string | null) => {
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
              <ActionIcon variant="transparent" onClick={onNextDay} disabled={isToday(day)}>
                <IconChevronRight />
              </ActionIcon>
            </Flex>
          </Menu>
        </Flex>
        <Flex flex={1} direction={"row"}>
          <Container pb={"xl"} pl={0} fluid maw={400}>
            <PlacesVisitedTimelineContainer date={day} onFilterChange={handleMapFilterChange} />
          </Container>
        </Flex>
      </Flex>
    </ScrollArea>
  );
}

import { ActionIcon, Button, Container, Flex, Group, Menu, Paper, ScrollArea, Space, Title } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconChevronLeft, IconChevronRight, IconSettings } from "@tabler/icons-react";
import { addDays, format, subDays } from "date-fns";
import { isToday } from "date-fns/isToday";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { useState } from "react";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ActivityTimelineConfigMenu,
  type TimelineFilters,
} from "../../components/ActivityTimelineConfigMenu/ActivityTimelineConfigMenu";
import { safeScrollableArea } from "../../constants";
import ActivityTimelineContainer from "../../containers/ActivityTimelineContainer";
import { useConfig } from "../../contexts/ConfigContext";

export default function TimelinePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlDayFormat = "yyyy-MM-dd";
  const daySearchParam = searchParams.get("day");
  const day = daySearchParam ? startOfDay(parse(daySearchParam, urlDayFormat, new Date())) : startOfDay(new Date());
  const [filters, setFilters] = useState<TimelineFilters>({
    habit: true,
    location: true,
    website: true,
  });

  const handleNextDay = () => {
    const dayAfter = format(addDays(day, 1), urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day: dayAfter,
      }).toString(),
    });
  };

  const handlePreviousDayClick = () => {
    const dayBefore = format(subDays(day, 1), urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day: dayBefore,
      }).toString(),
    });
  };

  const handlePickerChange = (value: string | null) => {
    const date = value ? new Date(value) : new Date();
    const day = format(date, urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day,
      }).toString(),
    });
  };

  const { theme } = useConfig();
  const formattedDate = format(day, "MMMM do, yyyy");
  return (
    <Paper p={0} component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea pr={"md"} pl={"md"} h={safeScrollableArea}>
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
          <Group justify="space-between" w={"100%"}>
            <Group gap={0}>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button component={Title} fw={400} order={2} c={"unset"} p={0} variant="transparent">
                    {formattedDate}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown w={270}>
                  <DatePicker type="default" value={day} onChange={handlePickerChange} />
                </Menu.Dropdown>
                <Space w={"xl"} />
                <ActionIcon variant="transparent" onClick={handlePreviousDayClick}>
                  <IconChevronLeft />
                </ActionIcon>
                <Space w={"lg"} />
                <ActionIcon variant="transparent" onClick={handleNextDay} disabled={isToday(day)}>
                  <IconChevronRight />
                </ActionIcon>
              </Menu>
            </Group>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon m={0} variant="transparent" size="md" onClick={() => {}}>
                  <IconSettings />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <ActivityTimelineConfigMenu value={filters} onChange={setFilters} />
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Container pb={"xl"} pl={0} fluid>
            <ActivityTimelineContainer date={day} filters={filters} />
          </Container>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}

import { Container, Paper } from "@mantine/core";
import { addDays, format, subDays } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { useState } from "react";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import type { TimelineFilters } from "../../components/ActivityTimelineConfigMenu/ActivityTimelineConfigMenu";
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
      <ActivityTimelineContainer />
    </Paper>
  );
}

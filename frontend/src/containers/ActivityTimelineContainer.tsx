import { Container, Flex } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { endOfDay } from "date-fns/endOfDay";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { useState } from "react";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { trpc } from "../api/trpc";
import type { TimelineFilters } from "../components/ActivityTimeline/ActivityTimelineConfigMenu";
import { ActivityTimelineControls } from "../components/ActivityTimeline/ActivityTimelineControls";
import { ActivityTimelineList } from "../components/ActivityTimeline/ActivityTimelineList";

export default function ActivityTimelineContainer() {
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

  const handleDateChange = (date: Date) => {
    const day = format(date, urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day,
      }).toString(),
    });
  };

  const formattedDate = format(day, "MMMM do, yyyy");
  const { data, isPending } = useQuery(
    trpc.timelineRouter.listActivities.queryOptions({
      start: startOfDay(day).toISOString(),
      end: endOfDay(day).toISOString(),
      filters: filters ?? { habit: true, location: true, website: true },
    }),
  );

  return (
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
      <ActivityTimelineControls
        date={day}
        formattedDate={formattedDate}
        onDateChange={handleDateChange}
        onFiltersChange={setFilters}
        filters={filters}
      />
      {isPending || !data ? null : <ActivityTimelineList activities={data.activities} />}
    </Flex>
  );
}

import { Container, Flex } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { useState } from "react";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import type { TimelineFilters } from "../../components/ActivityTimeline/ActivityTimelineConfigMenu";
import { ActivityTimelineControls } from "../../components/ActivityTimeline/ActivityTimelineControls";
import { ActivityTimelineList } from "../../components/ActivityTimeline/ActivityTimelineList";
import ActivityTimelineOverviewContainer from "./ActivityTimelineOverviewContainer";

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
      day: format(day, urlDayFormat),
      filters: filters ?? { habit: true, location: true, website: true },
    }),
  );

  return (
    <Flex
      direction="column"
      align={"center"}
      component={Container}
      fluid
      h="100vh"
      ta="left"
      pt="lg"
      pl={0}
      pr={0}
      gap="lg"
    >
      <ActivityTimelineControls
        date={day}
        formattedDate={formattedDate}
        onDateChange={handleDateChange}
        onFiltersChange={setFilters}
        filters={filters}
      />

      <Flex
        flex={1}
        maw={"100%"}
        mih={0}
        h={"100%"}
        pl={"lg"}
        pr={"lg"}
        gap="lg"
        justify="center"
        direction={{ base: "column", sm: "row" }}
      >
        <ActivityTimelineOverviewContainer day={day} />
        <ActivityTimelineList isLoading={isPending || !data} activities={data?.activities} />
      </Flex>
    </Flex>
  );
}

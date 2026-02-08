import { Container, Flex, Skeleton, Stack } from "@mantine/core";
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
    <Flex direction="column" component={Container} fluid h="100vh" ta="left" pt="lg" pl={0} pr={0} gap="lg">
      <ActivityTimelineControls
        date={day}
        formattedDate={formattedDate}
        onDateChange={handleDateChange}
        onFiltersChange={setFilters}
        filters={filters}
      />

      <Flex flex={1} h={"100%"} pl={"lg"} gap="lg" align="flex-start" direction={{ base: "column", md: "row" }}>
        <ActivityTimelineOverviewContainer day={day} />
        {isPending || !data ? (
          <Stack flex={1} pr={"lg"}>
            <Skeleton h={150} bdrs={"lg"} />
            <Skeleton h={150} bdrs={"lg"} />
            <Skeleton h={150} bdrs={"lg"} />
            <Skeleton h={150} bdrs={"lg"} />
            <Skeleton h={150} bdrs={"lg"} />
            <Skeleton h={150} bdrs={"lg"} />
          </Stack>
        ) : (
          <ActivityTimelineList activities={data.activities} />
        )}
      </Flex>
    </Flex>
  );
}

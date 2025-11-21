import { Container, Flex, ScrollArea } from "@mantine/core";
import { safeScrollableArea } from "../../constants";
import { DailyHabitEntriesContainer } from "../../containers/DailyHabitEntries";
import DailyWeatherOverviewContainer from "../../containers/DailyWeatherOverviewContainer";

export default function HomeRight(props: { day: Date }) {
  const { day } = props;
  return (
    <ScrollArea h={safeScrollableArea} type="never">
      <Flex component={Container} fluid pt={"xl"} pr={0}>
        <DailyHabitEntriesContainer date={day} />
        <Container pl={0} fluid>
          <DailyWeatherOverviewContainer date={day} />
        </Container>
      </Flex>
    </ScrollArea>
  );
}

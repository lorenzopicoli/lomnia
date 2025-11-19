import { Flex, Grid } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { trpc } from "../api/trpc";
import { Anonymize } from "../components/Anonymize/Anonymize";
import { LoIcon } from "../components/LoIcon";
import { useConfig } from "../contexts/ConfigContext";
import { getRandomColor } from "../utils/getRandomColor";
import { iconForKey } from "../utils/personal";

type DailyHabitEntriesProps = {
  date: Date;
};

export default function DailyHabitEntriesContainer(props: DailyHabitEntriesProps) {
  const config = useConfig();
  const { data, isLoading } = useQuery(
    trpc.getHabitsByDay.queryOptions({
      day: format(props.date, "yyyy-MM-dd"),
      privateMode: config.privateMode,
    }),
  );

  if (isLoading) {
    return "Loading...";
  }

  if (!data) {
    return null;
  }

  return (
    <Grid gutter={"md"}>
      {data.map((h) => (
        <Grid.Col key={h.key} span={6}>
          <Flex key={h.key} gap={"sm"}>
            <LoIcon Icon={iconForKey(h.key ?? "")} color={getRandomColor()} />
            <span>
              <Anonymize>
                {h.label}
                {typeof h.value !== "boolean" ? `: ${h.value}` : ""}
              </Anonymize>
            </span>
          </Flex>
        </Grid.Col>
      ))}
    </Grid>
  );
}

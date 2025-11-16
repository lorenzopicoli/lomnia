import { Flex, Grid } from "@mantine/core";
import { format } from "date-fns/format";
import { trpc } from "../api/trpc";
import { Anonymize } from "../components/Anonymize/Anonymize";
import { LoIcon } from "../components/LoIcon";
import { getRandomColor } from "../utils/getRandomColor";
import { iconForKey } from "../utils/personal";
import { useConfig } from "../utils/useConfig";

type DailyHabitEntriesProps = {
  date: Date;
};

export default function DailyHabitEntriesContainer(props: DailyHabitEntriesProps) {
  const config = useConfig();
  const { data, isLoading } = trpc.getHabitsByDay.useQuery({
    day: format(props.date, "yyyy-MM-dd"),
    privateMode: config.privateMode,
  });

  if (isLoading) {
    return "Loading...";
  }

  if (!data) {
    return "No data";
  }

  return (
    <>
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
    </>
  );
}

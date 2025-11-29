import { Button, Container, Flex, Input, Paper, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch, IconTransform } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { NumberParam, StringParam, useQueryParams } from "use-query-params";
import { type RouterOutputs, trpc } from "../../api/trpc";
import { Table, type TableColumn } from "../../components/Table/Table";
import { useConfig } from "../../contexts/ConfigContext";

type Habit = RouterOutputs["habits"]["getRawHabitsTable"][number];
export function RawHabits() {
  const { theme } = useConfig();
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  });

  const search = params.search ?? "";
  const [debouncedParams] = useDebouncedValue(params, 300);
  const { data, isLoading } = useQuery(
    trpc.habits.getRawHabitsTable.queryOptions({
      page: debouncedParams.page ?? 1,
      search: debouncedParams.search ?? undefined,
      limit: 100,
    }),
  );
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setParams({ search: event.currentTarget.value });
  };

  const columns: TableColumn<Habit>[] = [
    {
      key: "date",
      header: "Date",
      render: (habit) => (
        <>
          {habit.periodOfDay ? `${habit.periodOfDay} - ` : null}
          {habit.isFullDay ? new Date(habit.date).toLocaleDateString() : new Date(habit.date).toLocaleString()}
        </>
      ),
    },
    {
      key: "key",
      header: "Key",
      render: (habit) => habit.key,
    },
    {
      key: "value",
      header: "Value",
      render: (habit) =>
        typeof habit.value === "string" || typeof habit.value === "number" ? habit.value : JSON.stringify(habit.value),
    },
    {
      key: "source",
      header: "Source",
      render: (habit) => habit.source,
    },
  ];

  return (
    <Paper component={Container} fluid bg={theme.colors.dark[9]}>
      <Stack pt={"md"} h="100vh" style={{ overflow: "hidden" }}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"} p={0}>
          <Input
            flex={1}
            onChange={handleSearchChange}
            value={search}
            placeholder="Search"
            leftSection={<IconSearch size={16} />}
            maw={400}
          />
          <Button variant="subtle" leftSection={<IconTransform size={16} />}>
            Habits Features
          </Button>
        </Flex>

        <Table data={data ?? []} columns={columns} getRowKey={(habit) => habit.id} isLoading={isLoading} />
      </Stack>
    </Paper>
  );
}

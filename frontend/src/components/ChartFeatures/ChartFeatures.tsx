import { Flex, Select, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../api/trpc";
import { type ChartId, chartParamByChartId } from "../../charts/types";

type FormValues = {
  habitKey?: string;
  countKey?: string;
  title: string;
};

export function ChartFeatures<T extends FormValues>(props: { chartId: ChartId; form: UseFormReturnType<T> }) {
  const { chartId, form } = props;

  const { data: habitKeysData } = useQuery(trpc.habits.getKeys.queryOptions());
  const { data: countKeysData } = useQuery(trpc.charts.counts.getCountKeys.queryOptions());

  return (
    <Flex direction={"column"} gap={"md"} pb={"md"}>
      <TextInput flex={1} label="Title" withAsterisk {...form.getInputProps("title", { type: "input" })} />
      {chartId
        ? chartParamByChartId[chartId].map((feature) => {
            switch (feature) {
              case "countKey":
                return (
                  <Select
                    key={feature}
                    label="What to count"
                    withAsterisk
                    data={countKeysData?.map((k) => ({ value: k, label: k })) ?? []}
                    searchable
                    {...form.getInputProps("countKey", { type: "input" })}
                  />
                );
              case "habitKey":
                return (
                  <Select
                    key={feature}
                    label="Habit"
                    withAsterisk
                    data={habitKeysData?.numeric.map((hk) => ({ value: hk.key, label: hk.label })) ?? []}
                    searchable
                    {...form.getInputProps("habitKey", { type: "input" })}
                  />
                );
              default:
                return null;
            }
          })
        : null}
    </Flex>
  );
}

import { Checkbox, Flex, Select, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../api/trpc";
import { aggregationFunctionLabels, type ChartId, chartParamByChartId } from "../../charts/types";

type FormValues = {
  habitKey?: string;
  countKey?: string;
  compactNumbers?: boolean;
  title: string;
};

export function ChartFeatures<T extends FormValues>(props: { chartId: ChartId; form: UseFormReturnType<T> }) {
  const { chartId, form } = props;

  const { data: habitKeysData } = useQuery(trpc.habitFeatures.getKeys.queryOptions());
  const { data: countKeysData } = useQuery(trpc.charts.counts.getCountKeys.queryOptions());

  return (
    <Flex direction={"column"} gap={"lg"} pb={"md"}>
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
              case "habitKey": {
                // TODO: How to avoid always showing all?
                const numeric = habitKeysData?.numeric.map((hk) => ({ value: hk.key, label: hk.label }));
                const text = habitKeysData?.text.map((hk) => ({ value: hk.key, label: hk.label }));
                return (
                  <Select
                    key={feature}
                    label="Habit"
                    withAsterisk
                    data={[...(numeric ?? []), ...(text ?? [])]}
                    searchable
                    {...form.getInputProps("habitKey", { type: "input" })}
                  />
                );
              }
              case "aggFun":
                return (
                  <Select
                    key={feature}
                    label="Aggregate"
                    withAsterisk
                    data={aggregationFunctionLabels}
                    searchable
                    {...form.getInputProps("aggFun", { type: "input" })}
                  />
                );
              case "compactNumbers":
                return (
                  <Checkbox
                    key={feature}
                    label="Use compact number notation (1.2k, 3.4M…)"
                    {...form.getInputProps("compactNumbers", { type: "checkbox" })}
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

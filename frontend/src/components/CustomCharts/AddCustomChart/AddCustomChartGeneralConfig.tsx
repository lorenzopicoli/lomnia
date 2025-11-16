import { Checkbox, Collapse, Divider, Flex, Group, Select, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { RouterOutputs } from "../../../api/trpc";
import {
  aggregationFunctions,
  aggregationPeriods,
  type ChartSource,
  chartSourceTitleAndDescription,
  stringToChartSource,
} from "../../../charts/charts";
import { getKeys } from "../../../utils/getKeys";
import type { AddCustomChartFormValues } from "./AddCustomChart";
import styles from "./AddCustomChart.module.css";

export function AddCustomChartGeneralConfig(props: {
  xKeys: RouterOutputs["getAvailableKeys"]["xKeys"];
  showAggregationOptions: boolean;
  selectedSources: ChartSource[];
  toggleWantsToAggregate: () => void;
  form: UseFormReturnType<AddCustomChartFormValues>;
}) {
  const { xKeys, showAggregationOptions, selectedSources, toggleWantsToAggregate, form } = props;

  const groupOptions = getKeys(xKeys)
    .filter((s) => selectedSources.includes(s as ChartSource))
    .map((group) => ({
      group: chartSourceTitleAndDescription(stringToChartSource(group)).title,
      items: xKeys[group].map((item) => ({
        value: `${group}-${item.key}`,
        label: item.key === "date" ? `${item.label} (recommended)` : item.label,
      })),
    }));

  return (
    <>
      <Divider m={"md"} />
      <Flex direction={"row"} gap={"md"} p={"sm"} wrap="wrap" justify={"space-between"}>
        <Select
          label="X axis"
          placeholder=""
          data={groupOptions}
          width={"50%"}
          key={form.key("xKey")}
          {...form.getInputProps("xKey", { type: "input" })}
        />
        <div>
          <Checkbox.Card
            className={styles.cardCheckbox}
            radius="md"
            checked={showAggregationOptions}
            onClick={toggleWantsToAggregate}
          >
            <Group wrap="nowrap" align="flex-start">
              <Checkbox.Indicator />
              <div>
                <Text className={styles.cardCheckboxTitle}>Aggregate data</Text>
                <Text className={styles.cardCheckboxDescription}>
                  Use this to see aggregated data for a period (ie. monthly data)
                </Text>
              </div>
            </Group>
          </Checkbox.Card>

          <Flex direction={"row"} gap={"md"} pt={"sm"} wrap="wrap">
            <Collapse in={showAggregationOptions}>
              <Select
                label="Period"
                placeholder=""
                data={aggregationPeriods}
                key={form.key("aggregation.period")}
                {...form.getInputProps("aggregation.period")}
              />

              <Select
                label="Function"
                placeholder=""
                data={aggregationFunctions}
                key={form.key("aggregation.fun")}
                {...form.getInputProps("aggregation.fun")}
              />
            </Collapse>
          </Flex>
        </div>
      </Flex>
    </>
  );
}

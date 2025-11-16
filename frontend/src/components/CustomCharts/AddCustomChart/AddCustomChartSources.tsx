import { Checkbox, Flex, Group, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { type ChartSource, chartSourceTitleAndDescription } from "../../../charts/charts";
import type { AddCustomChartFormValues } from "./AddCustomChart";
import styles from "./AddCustomChart.module.css";

export function AddCustomChartSources(props: {
  sources: ChartSource[];
  form: UseFormReturnType<AddCustomChartFormValues>;
}) {
  const { sources, form } = props;
  return (
    <Flex direction={"row"} gap={"md"} p={"sm"} wrap="wrap" justify={"space-between"}>
      {sources.map((source) => {
        const { title, description } = chartSourceTitleAndDescription(source);
        return (
          <Checkbox.Card
            className={styles.cardCheckbox}
            radius="md"
            checked={form.getValues().sources[source]}
            onClick={() => {
              const previousSources = { ...form.getValues().sources };
              form.reset();
              form.setFieldValue(`sources`, {
                ...previousSources,
                [source]: !previousSources[source],
              });
            }}
          >
            <Group wrap="nowrap" align="flex-start">
              <Checkbox.Indicator />
              <div>
                <Text className={styles.cardCheckboxTitle}>{title}</Text>
                <Text className={styles.cardCheckboxDescription}>{description}</Text>
              </div>
            </Group>
          </Checkbox.Card>
        );
      })}
    </Flex>
  );
}

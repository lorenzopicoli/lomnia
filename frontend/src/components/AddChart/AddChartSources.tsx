import type { UseFormReturnType } from "@mantine/form";
import type { AddChartFormValues } from "./AddChart";
import { Text, Checkbox, Flex, Group } from "@mantine/core";
import styles from "./AddChart.module.css";
import { chartSourceTitleAndDescription, type ChartSource } from "../../charts/charts";

export function AddChartSources(props: { sources: ChartSource[]; form: UseFormReturnType<AddChartFormValues> }) {
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

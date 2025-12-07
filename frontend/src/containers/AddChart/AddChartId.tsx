import { Flex, Group, Radio, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { availableCharts } from "../../charts/types";
import styles from "./AddChart.module.css";
import type { AddChartFormValues } from "./AddChartContainer";

export function AddChartId(props: { form: UseFormReturnType<AddChartFormValues> }) {
  const { form } = props;
  return (
    <Flex direction={"row"} gap={"md"} wrap="wrap" justify={"space-between"}>
      {availableCharts
        .filter((chart) => chart.sources.includes(form.values.source))
        .map((chart) => {
          return (
            <Radio.Card
              key={chart.id}
              className={styles.cardCheckbox}
              radius="md"
              checked={form.getValues().chartId === chart.id}
              onClick={() => {
                form.setFieldValue("chartId", chart.id);
              }}
            >
              <Group wrap="nowrap" align="flex-start">
                <Radio.Indicator />
                <div>
                  <Text className={styles.cardRadioTitle}>{chart.title}</Text>
                  <Text className={styles.cardRadioDescription}>{chart.description}</Text>
                </div>
              </Group>
            </Radio.Card>
          );
        })}
    </Flex>
  );
}

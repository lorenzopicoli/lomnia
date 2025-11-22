import { Flex, Group, Radio, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { availableCharts, type ChartSource, chartSourceTitleAndDescription } from "../../charts/types";
import type { AddChartFormValues } from "./AddChart";
import styles from "./AddChart.module.css";

export function AddChartSource(props: { sources: ChartSource[]; form: UseFormReturnType<AddChartFormValues> }) {
  const { sources, form } = props;
  return (
    <Flex direction={"row"} gap={"md"} p={"sm"} wrap="wrap" justify={"space-between"}>
      {sources.map((source) => {
        const { title, description } = chartSourceTitleAndDescription(source);
        return (
          <Radio.Card
            key={source}
            className={styles.cardCheckbox}
            radius="md"
            checked={form.getValues().source === source}
            onClick={() => {
              form.reset();
              form.setFieldValue("source", source);
              form.setFieldValue("chartId", availableCharts.find((c) => c.sources.includes(source))?.id ?? null);
            }}
          >
            <Group wrap="nowrap" align="flex-start">
              <Radio.Indicator />
              <div>
                <Text className={styles.cardRadioTitle}>{title}</Text>
                <Text className={styles.cardRadioDescription}>{description}</Text>
              </div>
            </Group>
          </Radio.Card>
        );
      })}
    </Flex>
  );
}

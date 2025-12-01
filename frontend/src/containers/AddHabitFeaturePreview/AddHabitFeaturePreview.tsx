import { Card, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { v4 } from "uuid";
import { type RouterOutputs, trpc } from "../../api/trpc";
import { Table, type TableColumn } from "../../components/Table/Table";
import type { HabitFeatureRule } from "../../containers/HabitFeatureBuilder/types";
import { useConfig } from "../../contexts/ConfigContext";

export function AddHabitFeaturePreview(props: { rules: HabitFeatureRule[] }) {
  const { theme } = useConfig();
  const { rules } = props;

  const { data, isLoading } = useQuery(trpc.habits.previewFeaturesExtraction.queryOptions(rules));
  const columns: TableColumn<RouterOutputs["habits"]["previewFeaturesExtraction"][number]>[] = [
    {
      key: "Habit ID",
      header: "Habit ID",
      width: 100,
      render: (feature) => feature.habit.id,
    },
    {
      key: "Habit Key",
      header: "Habit Key",
      render: (feature) => feature.habit.key,
    },
    {
      key: "Original",
      header: "Original Value",
      render: (feature) => String(feature.feature.originalValue ?? "-"),
    },
    {
      key: "Extracted",
      header: "Extracted Value",
      render: (feature) => String(feature.feature.value ?? "-"),
    },
  ];
  return (
    <>
      <Card.Section p={"md"}>
        <Title order={3}>Preview Results</Title>
      </Card.Section>
      <Text c={theme.colors.gray[6]} size="sm">
        Displaying the first 100 extracted features
      </Text>
      <Card.Section p={"md"}>
        <Table data={data ?? []} columns={columns} getRowKey={() => v4()} isLoading={isLoading} />
      </Card.Section>
    </>
  );
}

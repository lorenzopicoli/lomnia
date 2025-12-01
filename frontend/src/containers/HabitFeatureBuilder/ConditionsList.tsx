import { ActionIcon, alpha, Flex, Select, Stack, Text, TextInput } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { ChangeEvent } from "react";
import { useConfig } from "../../contexts/ConfigContext";
import type { HabitFeatureCondition } from "./types";

export function ConditionsList(props: {
  conditions: HabitFeatureCondition[];
  onConditionChanged: (newCondition: HabitFeatureCondition, index: number) => void;
  onConditionRemoved: (index: number) => void;
}) {
  const { theme } = useConfig();
  const handleRemoveCondition = (i: number) => {
    props.onConditionRemoved(i);
  };
  const handleFieldChange = (index: number) => (value: string | null) => {
    const condition = props.conditions[index];
    props.onConditionChanged({ ...condition, field: (value as any) || "key" }, index);
  };

  const handleValueChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const condition = props.conditions[index];
    const value = e.target.value;
    props.onConditionChanged({ ...condition, value }, index);
  };

  return (
    <Stack gap={"sm"}>
      <Text size="sm">Conditions (AND)</Text>
      {props.conditions.map((condition, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Flex key={i} gap={"sm"}>
          <Select
            flex={0}
            miw={100}
            value={condition.field}
            onChange={handleFieldChange(i)}
            placeholder="Match property"
            data={[
              { value: "key", label: "Key" },
              { value: "text_value", label: "Value" },
              { value: "source", label: "Source" },
            ]}
          />
          <TextInput flex={1} placeholder="Value" value={condition.value ?? ""} onChange={handleValueChange(i)} />
          <ActionIcon flex={0} variant="subtle" onClick={() => handleRemoveCondition(i)}>
            <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
          </ActionIcon>
        </Flex>
      ))}
    </Stack>
  );
}
